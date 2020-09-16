/**
 * On chain privacy allows the dynamic addition or removal of members. This application tests this ability.
 */
const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/manageOnChainPrivacyGroup");

const Utils = require("./helpers.js");
const { orion, besu } = require("../keys.js");

const node1 = new EEAClient(new Web3(besu.node1.url), 2018);
const node2 = new EEAClient(new Web3(besu.node2.url), 2018);
const node3 = new EEAClient(new Web3(besu.node3.url), 2018);

module.exports = async () => {

  console.log("Creating on-chain privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new on-chain privacy group with ID: ", privacyGroupId);

  console.log("Finding on-chain privacy groups on Nodes 1,2. Expect to find the privacy group just created: ", privacyGroupId);
  const privacyGroups = await privacyGroup.findOnChainPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  Utils.logMatchingGroup(
    privacyGroups,
    privacyGroupId
  );

  console.log("Non-owner tries to add Node3 to the privacy group: ", privacyGroupId);
  const addResultAttempt = await node1.privx.addToPrivacyGroup({
    participants: [orion.node3.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node2.publicKey,
    privacyGroupId: privacyGroupId,
    privateKey: besu.node2.privateKey
  });
  console.log("Added Node3 to privacy group: ", privacyGroupId);
  console.log(addResultAttempt);

  const failedReceiptFromNode3 = await node3.priv.getTransactionReceipt(
    addResultAttempt.commitmentHash,
    orion.node3.publicKey
  );

  console.log("Owner of privacy group adds Node3 to the privacy group: ", privacyGroupId);
  const addResult = await node1.privx.addToPrivacyGroup({
    participants: [orion.node3.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log("Added Node3 to privacy group: ", privacyGroupId);
  console.log(addResult);

  const receiptFromNode3 = await node3.priv.getTransactionReceipt(
    addResult.commitmentHash,
    orion.node3.publicKey
  );
  // console.log("Got transaction receipt from added node:");
  // console.log(receiptFromNode3);

  console.log("Finding on-chain privacy groups on Nodes 1,2,3. Expect to find the privacy group previously created: ", privacyGroupId);
  const privacyGroupsWithAddedNode = await privacyGroup.findOnChainPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey, orion.node3.publicKey]);
  Utils.logMatchingGroup(
    privacyGroupsWithAddedNode,
    privacyGroupId
  );

  console.log("Owner of privacy group removes Node3 from the privacy group: ", privacyGroupId);
  const removeResult = await node1.privx.removeFromPrivacyGroup({
    participant: orion.node3.publicKey,
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  // console.log("Removed Node3 from privacy group: ", privacyGroupId);
  // console.log(removeResult);

  console.log("Finding on-chain privacy groups on Nodes 1,2,3. Expect NOT to find the privacy group previously created: ", privacyGroupId);
  const privacyGroupsWithRemovedNode123 = await privacyGroup.findOnChainPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey, orion.node3.publicKey]);
  Utils.logMatchingGroup(
    privacyGroupsWithRemovedNode123,
    privacyGroupId
  );

  console.log("Finding on-chain privacy groups on Nodes 1,2. Expect to find the privacy group previously created: ", privacyGroupId);
  const privacyGroupsWithRemovedNode12 = await privacyGroup.findOnChainPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  Utils.logMatchingGroup(
    privacyGroupsWithRemovedNode12,
    privacyGroupId
  );
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
