/**
 * Creates a privacy group. Deploys a smart contract to the privacy group, with automatic
 * generation and signing of the Privacy Marker Transaction.
 */

const fs = require("fs");
const path = require("path");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");
const manageContract = require("../privacyGroupManagement/manageContract");
const configFileHandler = require("../config/configFileHandler");

const { orion, besu } = require("../keys.js");

const crossContractBinary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/CrossContractReader.json")
)).bytecode;

module.exports = async () => {
  let privateTransactionHashOfContract;

  console.log("Creating privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new privacy group with ID:", privacyGroupId);

  console.log("Deploying Cross Contract smart contract to privacy group: ", privacyGroupId);
  const contractAddress = await manageContract
    .createPrivateContract(crossContractBinary, null, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey)
    .then(privateTransactionHash => {
      console.log("Private Transaction Hash\n", privateTransactionHash);
      privateTransactionHashOfContract = privateTransactionHash;
      return manageContract.getPrivateContractAddress(privateTransactionHash, orion.node1.publicKey)
    })
    .then(contractAddress => {
      console.log("contractAddress: ", contractAddress);
      return contractAddress;
    })
    .catch(console.error);

  // save the contract information to a file
  const privateCrossContract = {};
  privateCrossContract.privateCrossContract = {};
  privateCrossContract.privateCrossContract.privacyGroupId = privacyGroupId;
  privateCrossContract.privateCrossContract.contractAddress = contractAddress;
  privateCrossContract.privateCrossContract.privateTransactionHashOfContract = privateTransactionHashOfContract;

  configFileHandler.writeToConfigFile(privateCrossContract);

  return { contractAddress, privacyGroupId };
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
