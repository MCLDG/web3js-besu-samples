const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("web3-eea");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.url), 2018);

function run() {
  if (!process.env.CONTRACT_ADDRESS) {
    throw Error(
      "You need to export the following variable in your shell environment: CONTRACT_ADDRESS="
    );
  }

  if (!process.env.PRIVACY_GROUP_ID) {
    throw Error(
      "You need to export the following variable in your shell environment: PRIVACY_GROUP_ID="
    );
  }

  const address = process.env.CONTRACT_ADDRESS;
  const privacyGroupId = process.env.PRIVACY_GROUP_ID;

  const filter = {
    address
  };

  return node.priv.getPastLogs(privacyGroupId, filter).then(logs => {
    console.log("Received logs\n", logs);
    return logs;
  });
}

run();
