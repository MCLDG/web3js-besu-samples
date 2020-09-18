/**
 * Send transactions to a privacy group in batches. 
 * 
 * Creates a privacy group, deploys a smart contract to the privacy group, then execute the smart contract.
 * 
 * You will see 2 batches of transactions, each batch of size 5 (see vars TX_COUNT and BATCH_SIZE below)
 */

const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");
const PromisePool = require("async-promise-pool");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");

const { orion, besu } = require("../keys.js");

const greeterBinary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/greeter.json")
)).bytecode;

const greeterAbi = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/greeter.json")
)).abi;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node1 = new EEAClient(new Web3(besu.node1.url), 2018);

/*
  Transactions are sent in batches.
  - TX_COUNT defines the total of transactions
  - BATCH_SIZE defines how many transactions will be sent at once
*/
const TX_COUNT = 10;
const BATCH_SIZE = 5;

const callGenericFunctionOnContract = (
  web3,
  orionPrivateFrom,
  besuPrivateKey,
  address,
  privacyGroupId,
  method,
  value,
  nonce
) => {
  const contract = new web3.eth.Contract(greeterAbi);

  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === method;
  });

  const functionArgs =
    value !== null
      ? web3.eth.abi.encodeParameters(functionAbi.inputs, [value]).slice(2)
      : null;

  console.log(`Calling greeter smart contract at address: ${address} with private nonce: ${nonce}`);

  const functionCall = {
    to: address,
    data:
      functionArgs !== null
        ? functionAbi.signature + functionArgs
        : functionAbi.signature,
    privateFrom: orionPrivateFrom,
    privacyGroupId: privacyGroupId,
    privateKey: besuPrivateKey,
    nonce: nonce
  };
  return web3.priv.distributeRawTransaction(functionCall);
};

function printPrivTxDetails(pmtRcpt) {
  return privacyGroup
    .getTransactionReceipt(pmtRcpt.transactionHash)
    .then(privTxRcpt => {
      console.log(
        `=== Private TX ${privTxRcpt.transactionHash}\n` +
        `  > Status ${privTxRcpt.status}\n` +
        `  > Block #${pmtRcpt.blockNumber}\n` +
        `  > PMT Index #${pmtRcpt.transactionIndex}\n` +
        `  > PMT Hash ${pmtRcpt.transactionHash}\n`
      );
      return Promise.resolve();
    });
}

/*
  Example of sending private transactions in batch.
  
  The basic steps are:
  
  1. Find the expected public and private nonce for the sender account
  2. Ditribute the private transaction (incrementing the private nonce)
  3. Create a Private Market Transaction for each private transaction (incrementing the public nonce)
*/

module.exports = async () => {
  console.log("Creating privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);

  console.log("Deploying smart contract to privacy group: ", privacyGroupId);
  const greeterContractAddress = await privacyGroup
    .createPrivateContract(greeterBinary, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey)
    .then(privateTransactionHash => {
      console.log("Private Transaction Hash\n", privateTransactionHash);
      return privacyGroup.getPrivateContractAddress(privateTransactionHash, orion.node1.publicKey)
    })
    .catch(console.error);
  console.log("greeter smart contract deployed at address: ", greeterContractAddress);

  const besuAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${besu.node1.privateKey}`
  )
    .address;

  let privateNonce = await privacyGroup.getPrivateNonce(besuAccount, privacyGroupId);
  let publicNonce = await privacyGroup.getPublicNonce(besuAccount);
  console.log(`publicNonce for address ${besuAccount} is: ${publicNonce}`);

  const pool = new PromisePool({ concurrency: BATCH_SIZE });

  for (let i = 0; i < TX_COUNT; i += 1) {
    pool.add(() => {
      return callGenericFunctionOnContract(
        web3Node1,
        orion.node1.publicKey,
        besu.node1.privateKey,
        greeterContractAddress,
        privacyGroupId,
        "greet",
        null,
        privateNonce++
      ).then(enclaveKey => {
        return privacyGroup.sendPrivacyMarkerTransaction(
          enclaveKey, besu.node1.privateKey, publicNonce++
        );
      })
        .then(pmtRcpt => {
          return printPrivTxDetails(pmtRcpt);
        })
        .catch(error => {
          console.log("Error calling callGenericFunctionOnContract: ", error);
        });
    });
  }
  await pool.all();
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
