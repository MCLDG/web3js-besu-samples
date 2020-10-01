/**
 * Creates an on-chain privacy group. Deploys a smart contract to the privacy group, with automatic
 * generation and signing of the Privacy Marker Transaction.
 */
const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/manageOnChainPrivacyGroup");
const manageContract = require("../privacyGroupManagement/manageContract");
const configFileHandler = require("../config/configFileHandler");

const { orion, besu } = require("../keys.js");

const tokenBinary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/HumanStandardToken.json")
)).bytecode;

const tokenAbi = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/HumanStandardToken.json")
)).abi;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const contract = new web3.eth.Contract(tokenAbi);

// create HumanStandardToken constructor
// eslint-disable-next-line no-underscore-dangle
const constructorAbi = contract._jsonInterface.find(e => {
  return e.type === "constructor";
});
const constructorArgs = web3.eth.abi
  .encodeParameters(constructorAbi.inputs, [
    1000000,
    "PegaSys Token",
    10,
    "PegaSys"
  ])
  .slice(2);

module.exports = async () => {
  let privateTransactionHashOfContract;

  console.log("Creating on-chain privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new on-chain privacy group with ID:", privacyGroupId);

  console.log("Deploying Token smart contract to on-chain privacy group: ", privacyGroupId);
  const tokenContractAddress = await manageContract
    .createPrivateContract(tokenBinary, constructorArgs, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey)
    .then(privateTransactionHash => {
      console.log("Private Transaction Hash\n", privateTransactionHash);
      privateTransactionHashOfContract = privateTransactionHash;
      return manageContract.getPrivateContractAddress(privateTransactionHash, orion.node1.publicKey)
    })
    .catch(console.error);
  console.log("Token smart contract deployed at address: ", tokenContractAddress);

  // save the contract information to a file
  const privateTokenContract = {};
  privateTokenContract.privateTokenContract = {};
  privateTokenContract.privateTokenContract.privacyGroupId = privacyGroupId;
  privateTokenContract.privateTokenContract.contractAddress = tokenContractAddress;
  privateTokenContract.privateTokenContract.privateTransactionHashOfContract = privateTransactionHashOfContract;

  configFileHandler.writeToConfigFile(privateTokenContract);

  return { tokenContractAddress, privacyGroupId };
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
