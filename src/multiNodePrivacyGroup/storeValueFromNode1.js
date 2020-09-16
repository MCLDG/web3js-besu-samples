const fs = require('fs')
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const SimpleAbi = (JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../build/contracts/Simple.json"), 'utf8'))
).abi;

const { orion, besu } = require("../keys.js");

const storeValueFromNode1 = (address, value, privacyGroupId) => {
  const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
  const contract = new web3.eth.Contract(SimpleAbi);

  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "store";
  });
  const functionArgs = web3.eth.abi
    .encodeParameters(functionAbi.inputs, [value])
    .slice(2);

  const functionCall = {
    to: address,
    data: functionAbi.signature + functionArgs,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3.eea
    .sendRawTransaction(functionCall)
    .then(transactionHash => {
      console.log("Transaction Hash:", transactionHash);
      return web3.priv.getTransactionReceipt(
        transactionHash,
        orion.node1.publicKey
      );
    })
    .then(result => {
      console.log("Event Emitted:", result.logs[0].data);
      return result;
    });
};

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
  console.log(`EXPECTING AN ERROR: GETTING Value from: ${besu.node3.url}`);
  return getValue(
    besu.node3.url,
    address,
    orion.node3.publicKey,
    privacyGroupId,
    besu.node3.privateKey
  );
};

module.exports = {
  storeValueFromNode1,
  getValueFromNode1,
  getValueFromNode2,
  getValueFromNode3
};

if (require.main === module) {
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
  storeValueFromNode1(address, 1000, privacyGroupId)
    .then(() => {
      return getValueFromNode1(address, privacyGroupId);
    })
    .then(() => {
      return getValueFromNode2(address, privacyGroupId);
    })
    .then(() => {
      return getValueFromNode3(address, privacyGroupId);
    })
    .catch(console.log);
}
