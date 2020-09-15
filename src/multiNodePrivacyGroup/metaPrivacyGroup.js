/*
 Get privacy group metadata
*/

const fs = require("fs");
const path = require("path");
const Tx = require("ethereumjs-tx");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/managePrivacyGroup");
const privacyOnChainGroup = require("../privacyGroupManagement/manageOnChainPrivacyGroup");

const { orion, besu } = require("../keys.js");
const { listeners } = require("process");

const binary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json")
)).bytecode;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);
const web3Node3 = new EEAClient(new Web3(besu.node3.url), 2018);

module.exports = async () => {
  const besuAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${besu.node1.privateKey}`
  )
    .address;

  console.log(`Finding privacy groups for Nodes 1,2`);
  let privacyGroups = await privacyGroup.findPrivacyGroupForNode([orion.node1.publicKey, orion.node2.publicKey]);

  for (let group in privacyGroups) {
    const txCount = await privacyGroup.getPrivateNonce(besuAccount, privacyGroups[group].privacyGroupId);
    console.log(`Retrieved transaction count from address ${besuAccount} for privacy group: ${privacyGroups[group].privacyGroupId}. TX count is: ${txCount}`);
  }

  console.log(`Finding privacy groups for Nodes 1,2,3`);
  privacyGroups = await privacyGroup.findPrivacyGroupForNode([orion.node1.publicKey, orion.node2.publicKey, orion.node3.publicKey]);
  console.log(`Finding privacy groups for Nodes 2,3`);
  privacyGroups = await privacyGroup.findPrivacyGroupForNode([orion.node2.publicKey, orion.node3.publicKey]);

  const txCount = await privacyGroup.getPublicNonce(besuAccount);
  console.log(`Retrieved public transaction count from address ${besuAccount}. TX count is: ${txCount}`);

  console.log(`Finding on-chain privacy groups for Nodes 1,2`);
  privacyGroups = await privacyOnChainGroup.findOnChainPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);

};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nIf you see an error stating 'Method not enabled' or similar..."
    );
    console.log(
      "\nThis example requires ONCHAIN privacy to be either DISABLED or ENABLED, depending on whether you are querying on-chain or off-chain privacy groups. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
