/**
 * Creates an on-chain privacy group. Deploys a smart contract to the privacy group, with automatic
 * generation and signing of the Privacy Marker Transaction.
 */
const fs = require("fs");
const path = require("path");

const privacyGroup = require("../privacyGroupManagement/manageOnChainPrivacyGroup");
const configFileHandler = require("../config/configFileHandler");

const { orion, besu } = require("../keys.js");

const greeterBinary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/greeter.json")
)).bytecode;

module.exports = async () => {

  console.log("Creating on-chain privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new on-chain privacy group with ID:", privacyGroupId);

  console.log("Deploying Greeter smart contract to on-chain privacy group: ", privacyGroupId);
  const greeterContractAddress = await privacyGroup
    .createPrivateContract(greeterBinary, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey)
    .then(privateTransactionHash => {
      console.log("Private Transaction Hash\n", privateTransactionHash);
      return privacyGroup.getPrivateContractAddress(privateTransactionHash, orion.node1.publicKey)
    })
    .catch(console.error);
  console.log("greeter smart contract deployed at address: ", greeterContractAddress);

  // save the contract information to a file
  const privateGreeterContract = {};
  privateGreeterContract.privateGreeterContract = {};
  privateGreeterContract.privateGreeterContract.privacyGroupId = privacyGroupId;
  privateGreeterContract.privateGreeterContract.contractAddress = greeterContractAddress;
  privateGreeterContract.privateGreeterContract.privateTransactionHashOfContract = privateTransactionHashOfContract;

  configFileHandler.writeToConfigFile(privateGreeterContract);

  return { greeterContractAddress, privacyGroupId };
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
