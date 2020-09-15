/**
 * Creates a privacy group. Deploys a smart contract to the privacy group, with automatic
 * generation and signing of the Privacy Marker Transaction.
 */

const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");

const { orion, besu } = require("../keys.js");

const binary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json")
)).bytecode;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const createPrivateContract = privacyGroupId => {
  const contractOptions = {
    data: `${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  console.log("Transaction Hash ", transactionHash);
  return web3.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      console.log("Private Transaction Receipt\n", privateTransactionReceipt);

      return privateTransactionReceipt.contractAddress;
    });
};

module.exports = async () => {
  console.log("Creating privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new privacy group with ID:", privacyGroupId);

  console.log("Deploying smart contract to privacy group: ", privacyGroupId);
  const contractAddress = await createPrivateContract(privacyGroupId)
    .then(getPrivateContractAddress)
    .catch(console.error);
  
  console.log(
    `now you have to run:\n export CONTRACT_ADDRESS=${contractAddress}`
  );
  console.log(` export PRIVACY_GROUP_ID=${privacyGroupId}`);

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
