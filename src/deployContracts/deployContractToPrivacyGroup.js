/**
 * Creates a privacy group. Deploys a smart contract to the privacy group, with automatic
 * generation and signing of the Privacy Marker Transaction.
 */

const fs = require("fs");
const path = require("path");
const yaml = require('js-yaml');

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");

const { orion, besu } = require("../keys.js");

const binary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json")
)).bytecode;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

module.exports = async () => {
  let privateTransactionHashOfContract;

  console.log("Creating privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new privacy group with ID:", privacyGroupId);

  console.log("Deploying smart contract to privacy group: ", privacyGroupId);
  const contractAddress = await privacyGroup
    .createPrivateContract(binary, orion.node1.publicKey, privacyGroupId, besu.node1.privateKey)
    .then(privateTransactionHash => {
      console.log("Private Transaction Hash\n", privateTransactionHash);
      privateTransactionHashOfContract = privateTransactionHash;
      return privacyGroup.getPrivateContractAddress(privateTransactionHash, orion.node1.publicKey)
    })
    .then(contractAddress => {
      console.log("contractAddress: ", contractAddress);
      return contractAddress;
    })
    .catch(console.error);

  // save the contract information to a file
  const privateSimpleContract = {};
  privateSimpleContract.privateSimpleContract = {};
  privateSimpleContract.privateSimpleContract.privacyGroupId = privacyGroupId;
  privateSimpleContract.privateSimpleContract.contractAddress = contractAddress;
  privateSimpleContract.privateSimpleContract.privateTransactionHashOfContract = privateTransactionHashOfContract;

  let yamlContracts = yaml.safeDump(privateSimpleContract);  
  fs.writeFileSync(path.join(__dirname, "../contracts.yaml"), yamlContracts, 'utf8');
  console.log("Writing smart contract info to file ./contracts.yaml: ", yamlContracts);

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
