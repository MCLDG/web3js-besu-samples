/**
 * Creates a privacy group. Deploys a smart contract to the privacy group.
 * The difference between this script and deployContractToPrivacyGroup.js is
 * that this controls creating and signing of the Privacy Marker Transaction, signing it outside 
 * of Besu. The process in deployContractToPrivacyGroup.js uses eea.sendRawTransaction to distribute,
 * create and sign the privacy marker in one step. See the function sendPrivacyMarkerTransaction
 * below for details on how we sign the Privacy Marker Transaction with a private key of our choosing, 
 * and pass in the enclaveKey to refer to the privacy group
 * 
 * The naming of the web3-eea function calls priv.distributeRawTransaction and eea.sendRawTransaction
 * is unfortunate. Both distribute the smart contract to the correct nodes, based on the privacy group.
 * In addition, eea.sendRawTransaction also signs the Privacy Marker Transaction.
 */

const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");
const configFileHandler = require("../config/configFileHandler");

const { orion, besu } = require("../keys.js");

const binary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json")
)).bytecode;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);
const web3Node3 = new EEAClient(new Web3(besu.node3.url), 2018);

let contractAddress;

const fetchFromOrion = txHash => {
  web3.priv
    .getTransactionReceipt(txHash, orion.node1.publicKey)
    .then(result => {
      console.log("Got transaction receipt from orion node 1: ", result);
      contractAddress = result.contractAddress;
    })
    .catch(console.error);
  web3Node2.priv
    .getTransactionReceipt(txHash, orion.node2.publicKey)
    .then(result => {
      console.log("Got transaction receipt from orion node 2: ", result);
    })
    .catch(console.error);
  web3Node3.priv
    .getTransactionReceipt(txHash, orion.node3.publicKey)
    .then(result => {
      console.log("Got transaction receipt from orion node 3: ", result);
    })
    .catch(console.error);
};

module.exports = async () => {
  console.log("Creating privacy group");
  const privacyGroupId = privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new privacy group with ID:", privacyGroupId);

  // returns the 32-byte enclave key. The enclave key is a pointer to the private transaction in Orion
  const enclaveKey = await privacyGroup.createPrivateContractNoPMT(
    binary, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey
  );
  console.log(`Enclave key: ${enclaveKey}`);

  const privacyMarkerTransactionResult = await privacyGroup.sendPrivacyMarkerTransaction(
    enclaveKey, besu.node1.privateKey
  );

  // get the transaction receipts of the privacy marker
  await privacyGroup.getTransactionReceipt(
    privacyMarkerTransactionResult.transactionHash
  ).then(privateTransactionReceipt => {
    console.log("Private Transaction Receipt for privacy marker TX\n", privateTransactionReceipt);
  });

  setTimeout(() => {
    // save the contract information to a file
    const privateSimpleContract = {};
    privateSimpleContract.privateSimpleContract = {};
    privateSimpleContract.privateSimpleContract.privacyGroupId = privacyGroupId;
    privateSimpleContract.privateSimpleContract.contractAddress = contractAddress;
    privateSimpleContract.privateSimpleContract.privateTransactionHashOfContract = privateTransactionHashOfContract;

    configFileHandler.writeToConfigFile(privateSimpleContract);
  }, 2000);

  // get the transaction receipts of the private contract deployment
  fetchFromOrion(privacyMarkerTransactionResult.transactionHash);
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}

