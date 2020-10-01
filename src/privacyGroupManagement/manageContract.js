
const Web3 = require("web3");
const EEAClient = require("web3-eea");
const Tx = require("ethereumjs-tx");

const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

// nonce is optional
const sendPrivacyMarkerTransaction = (enclaveKey, besuPrivateKey, nonce) => {
  return new Promise((resolve, reject) => {
    const besuAccount = web3.eth.accounts.privateKeyToAccount(
      `0x${besuPrivateKey}`
    );
    let count;
    if (nonce !== undefined) {
      count = nonce;
    }
    else {
      count = getPublicNonce(besuAccount.address);
    }
    console.log("Creating Private Marker Transaction with public nonce", count);

    const rawTx = {
      nonce: web3.utils.numberToHex(count),
      from: besuAccount.address,
      to: "0x000000000000000000000000000000000000007e",
      value: 0,
      data: enclaveKey,
      gasPrice: "0xFFFFF",
      gasLimit: "0xFFFFF"
    };
    const tx = new Tx(rawTx);
    tx.sign(Buffer.from(besuPrivateKey, "hex"));
    const hexTx = `0x${tx.serialize().toString("hex")}`;
    return web3.eth
      .sendSignedTransaction(hexTx)
      .on("receipt", r => {
        resolve(r);
      })
      .catch(e => {
        reject(e);
      });
  });
};

const createPrivateContract = (contractBinary, constructorArgs, orionPrivateFrom, privacyGroupId, besuPrivateKey) => {
  const contractOptions = {
    data:
      constructorArgs !== null
        ? contractBinary + constructorArgs
        : contractBinary,
    privateFrom: orionPrivateFrom,
    privacyGroupId: privacyGroupId,
    privateKey: besuPrivateKey
  };
  return web3.eea.sendRawTransaction(contractOptions);
};

const createPrivateContractNoPMT = (contractBinary, constructorArgs, orionPrivateFrom, privacyGroupId, besuPrivateKey) => {
  const contractOptions = {
    data:
      constructorArgs !== null
        ? contractBinary + constructorArgs
        : contractBinary,
    privateFrom: orionPrivateFrom,
    privacyGroupId: privacyGroupId,
    privateKey: besuPrivateKey
  };
  return web3.priv.distributeRawTransaction(contractOptions);
};

const getPrivateTransactionReceipt = (transactionHash, orionPrivateFrom) => {
  return web3.priv
    .getTransactionReceipt(transactionHash, orionPrivateFrom)
    .then(privateTransactionReceipt => {
      console.log("getPrivateContractAddress Private Transaction Receipt\n", privateTransactionReceipt);
      return privateTransactionReceipt;
    });
};

const getPrivateContractAddress = (transactionHash, orionPrivateFrom) => {
  return new Promise((resolve, reject) => {
    getPrivateTransactionReceipt(transactionHash, orionPrivateFrom)
      .then(receipt => {
        resolve(receipt.contractAddress);
      })
      .catch(reject);
  });

};

const getTransactionReceipt = txHash => {
  return new Promise((resolve, reject) => {
    web3.eth
      .getTransactionReceipt(txHash)
      .then(resolve)
      .catch(reject);
  });
};

module.exports = {
  sendPrivacyMarkerTransaction,
  createPrivateContract,
  createPrivateContractNoPMT,
  getPrivateTransactionReceipt,
  getPrivateContractAddress,
  getTransactionReceipt
};

if (require.main === module) {
  createPrivateContract();
}
