const Web3 = require("web3");
const EEAClient = require("../../src");
const { besu } = require("../keys.js");

const findGroup = require("./managePrivacyGroup");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

if (require.main === module) {
  if (!process.env.PRIVACY_GROUP_TO_DELETE) {
    throw Error(
      "You need to export the following variable in your shell environment: PRIVACY_GROUP_TO_DELETE="
    );
  }

  const privacyGroupId = process.env.PRIVACY_GROUP_TO_DELETE;
  deletePrivacyGroup(privacyGroupId);
}
