/**
 * Deploys a smart contract publicly, i.e. not to a privacy group
 */

const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");
const Tx = require("ethereumjs-tx");

const configFileHandler = require("../config/configFileHandler");

const { besu } = require("../keys.js");

const binary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json")
)).bytecode;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

module.exports = async () => {
  const besuAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${besu.node1.privateKey}`
  );
  return web3.eth
    .getTransactionCount(besuAccount.address, "pending")
    .then(count => {
      const rawTx = {
        nonce: web3.utils.numberToHex(count),
        from: besuAccount.address,
        value: 0,
        to: null,
        data: `${binary}`,
        gasPrice: "0xFFFFF",
        gasLimit: "0xFFFFF"
      };
      const tx = new Tx(rawTx);
      tx.sign(Buffer.from(besu.node1.privateKey, "hex"));
      const serializedTx = tx.serialize();
      return web3.eth.sendSignedTransaction(
        `0x${serializedTx.toString("hex")}`
      );
    })
    .then(transactionReceipt => {
      console.log("Public Transaction Receipt\n", transactionReceipt);

      // save the contract information to a file
      const publicSimpleContract = {};
      publicSimpleContract.publicSimpleContract = {};
      publicSimpleContract.publicSimpleContract.contractAddress = transactionReceipt.contractAddress;
      publicSimpleContract.publicSimpleContract.privateTransactionHashOfContract = transactionReceipt.transactionHash;

      configFileHandler.writeToConfigFile(publicSimpleContract);

      return transactionReceipt.contractAddress;
    });
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
