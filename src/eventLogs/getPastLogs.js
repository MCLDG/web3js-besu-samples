const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.url), 2018);

function run() {
  const yamlContracts = configFileHandler.readConfigFile();

  const privacyGroupId = yamlContracts.privateSimpleContract.privacyGroupId;
  const address = yamlContracts.privateSimpleContract.contractAddress;
  console.log("Contracts information. privacyGroupId: ", privacyGroupId);
  console.log("Contracts information. Address: ", address);

  const filter = {
    address
  };

  return node.priv.getPastLogs(privacyGroupId, filter).then(logs => {
    console.log("Received logs\n", logs);
    return logs;
  });
}

run();
