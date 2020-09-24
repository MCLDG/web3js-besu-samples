/**
 * Reads from the smart contract synchronously, using priv.call.
 * 
 * Note that priv.call is read-only, synchronous, and does not consume gas.
 */

const fs = require('fs')
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

const SimpleAbi = (JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/Simple.json"), 'utf8')
  )).abi;

const { orion, besu } = require("../keys.js");

const getValue = (url, address, privacyGroupId) => {
  const web3 = new EEAClient(new Web3(url), 2018);
  const contract = new web3.eth.Contract(SimpleAbi);

  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "value";
  });

  const functionCall = {
    to: address,
    data: functionAbi.signature,
    privacyGroupId
  };

  return web3.priv.call(functionCall).then(result => {
    console.log(`GOT Value from ${url}:`, result);
    return result;
  });
};

const getValueFromNode1 = (address, privacyGroupId) => {
  return getValue(
    besu.node1.url,
    address,
    privacyGroupId
  );
};

const getValueFromNode2 = (address, privacyGroupId) => {
  return getValue(
    besu.node2.url,
    address,
    privacyGroupId
  );
};

const getValueFromNode3 = (address, privacyGroupId) => {
  return getValue(
    besu.node3.url,
    address,
    privacyGroupId
  );
};

module.exports = {
  getValueFromNode1,
  getValueFromNode2,
  getValueFromNode3
};

if (require.main === module) {
  const yamlContracts = configFileHandler.readConfigFile();

  const privacyGroupId = yamlContracts.privateSimpleContract.privacyGroupId;
  const address = yamlContracts.privateSimpleContract.contractAddress;
  console.log("Contracts information. privacyGroupId: ", privacyGroupId);
  console.log("Contracts information. Address: ", address);

  console.log(`***** Getting values from smart contract Simple - SYNCRHRONOUSLY *****`);

  getValueFromNode1(address, privacyGroupId)
    .catch(console.error);;

  getValueFromNode2(address, privacyGroupId)
    .catch(console.error);;

  getValueFromNode3(address, privacyGroupId)
    .catch(console.error);;
}
