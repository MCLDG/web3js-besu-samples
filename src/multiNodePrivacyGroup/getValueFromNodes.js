/**
 * Reads from the smart contract asynchronously, using sendRawTranaction
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

const getValue = (url, address, privateFrom, privacyGroupId, privateKey) => {
  const web3 = new EEAClient(new Web3(url), 2018);
  const contract = new web3.eth.Contract(SimpleAbi);

  // eslint-disable-next-line no-underscore-dangle
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "value";
  });

  const functionCall = {
    to: address,
    data: functionAbi.signature,
    privateFrom,
    privacyGroupId,
    privateKey
  };

  return web3.eea
    .sendRawTransaction(functionCall)
    .then(transactionHash => {
      return web3.priv.getTransactionReceipt(
        transactionHash,
        orion.node1.publicKey
      );
    })
    .then(result => {
      console.log(`GOT Value from ${url}:`, result.output);
      return result;
    });
};

const getValueFromNode1 = (address, privacyGroupId) => {
  return getValue(
    besu.node1.url,
    address,
    orion.node1.publicKey,
    privacyGroupId,
    besu.node1.privateKey
  );
};

const getValueFromNode2 = (address, privacyGroupId) => {
  return getValue(
    besu.node2.url,
    address,
    orion.node2.publicKey,
    privacyGroupId,
    besu.node2.privateKey
  );
};

const getValueFromNode3 = (address, privacyGroupId) => {
  return getValue(
    besu.node3.url,
    address,
    orion.node3.publicKey,
    privacyGroupId,
    besu.node3.privateKey
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

  console.log(`***** Getting values from smart contract Simple - ASYNCRHRONOUSLY *****`);

  getValueFromNode1(address, privacyGroupId)
    .catch(console.error);;

  getValueFromNode2(address, privacyGroupId)
    .catch(console.error);;

  console.log(`EXPECTING AN ERROR: GETTING Value from: ${besu.node3.url}`);
  getValueFromNode3(address, privacyGroupId)
    .catch(console.error);;
}
