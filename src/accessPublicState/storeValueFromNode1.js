const fs = require('fs')
const path = require("path");

const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

const SimpleAbi = (JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../build/contracts/Simple.json"), 'utf8'))
).abi;

const CrossContractReaderAbi = (JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../build/contracts/CrossContractReader.json"), 'utf8'))
).abi;

const { orion, besu } = require("../keys.js");

const storeValueFromNode1 = (address, value) => {
  const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
  const contract = new web3.eth.Contract(SimpleAbi);

  // eslint-disable-next-line no-underscore-dangl
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "store";
  });
  const functionArgs = web3.eth.abi
    .encodeParameters(functionAbi.inputs, [value])
    .slice(2);

  const besuAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${besu.node1.privateKey}`
  );
  return web3.eth
    .getTransactionCount(besuAccount.address, "pending")
    .then(count => {
      const rawTx = {
        nonce: web3.utils.numberToHex(count),
        from: besuAccount.address,
        value: 0,
        to: address,
        data: `${functionAbi.signature + functionArgs}`,
        gasPrice: "0xFFFFF",
        gasLimit: "0xFFFFF"
      };
      const tx = new Tx(rawTx);
      tx.sign(Buffer.from(besu.node1.privateKey, "hex"));
      const serializedTx = tx.serialize();
      return web3.eth.sendSignedTransaction(
        `0x${serializedTx.toString("hex")}`
      );
    })
    .then(transactionReceipt => {
      console.log("Public Transaction Receipt\n", transactionReceipt);
      return transactionReceipt.transactionHash;
    });
};

const getValue = (
  url,
  publicAddress,
  privateAddress,
  privateFrom,
  privacyGroupId,
  privateKey
) => {
  const web3 = new EEAClient(new Web3(url), 2018);

  const contract = new web3.eth.Contract(CrossContractReaderAbi);

  // eslint-disable-next-line no-underscore-dangl
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "read";
  });

  const functionArgs = web3.eth.abi
    .encodeParameters(functionAbi.inputs, [publicAddress])
    .slice(2);

  const functionCall = {
    to: privateAddress,
    data: functionAbi.signature + functionArgs,
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
      console.log(`Get Value from ${url}:`, result.output);
      return result;
    });
};

const getValueFromNode1 = (publicAddress, privateAddress, privateFrom, privacyGroupId) => {
  return getValue(
    besu.node1.url,
    publicAddress,
    privateAddress,
    privateFrom,
    privacyGroupId,
    besu.node1.privateKey
  );
};

module.exports = {
  storeValueFromNode1,
  getValueFromNode1
};

if (require.main === module) {
  const yamlContracts = configFileHandler.readConfigFile();

  const publicSimpleContractAddress = yamlContracts.publicSimpleContract.contractAddress;
  const privateCrossContractAddress = yamlContracts.privateCrossContract.contractAddress;
  const privacyGroupId = yamlContracts.privateCrossContract.privacyGroupId;
  console.log("Contracts information. publicSimpleContractAddress: ", publicSimpleContractAddress);
  console.log("Contracts information. privateCrossContractAddress: ", privateCrossContractAddress);
  console.log("Contracts information. privacyGroupId: ", privacyGroupId);

  console.log(`***** Store values using Cross Contract public/private smart contract *****`);

  storeValueFromNode1(publicSimpleContractAddress, 1001)
    .then(() => {
      return getValueFromNode1(publicSimpleContractAddress, privateCrossContractAddress, orion.node1.publicKey, privacyGroupId);
    })
    .catch(console.log);
}
