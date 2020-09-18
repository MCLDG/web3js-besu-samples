const Web3 = require("web3");
const EEAClient = require("web3-eea");
const Tx = require("ethereumjs-tx");

const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const createPrivacyGroup = (addresses) => {
  const contractOptions = {
    addresses: addresses,
    name: "web3js-eea",
    description: "test"
  };
  return web3.priv.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created for nodes ${addresses} is:`, result);
    return result;
  });
};

const deletePrivacyGroup = privacyGroupId => {
  const contractOptions = {
    privacyGroupId: privacyGroupId
  };
  return web3.priv.deletePrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group deleted is:`, result);
    return result;
  });
};

const findPrivacyGroupForNode = (addresses) => {
  const contractOptions = {
    addresses: addresses
  };
  return web3.priv.findPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy groups found for nodes ${addresses} are:`, result);
    return result;
  });
};

// get nonce of account in the privacy group
const getPrivateNonce = (account, privacyGroupId) => {
  const contractOptions = {
    from: account,
    privacyGroupId: privacyGroupId
  };
  return web3.priv.getTransactionCount(contractOptions)
    .then(result => {
      return result;
    })
    .catch(console.error);
}

// get public nonce of account
const getPublicNonce = (account) => {
  return web3.eth.getTransactionCount(account, "pending");
}

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

const createPrivateContract = (contractBinary, orionPrivateFrom, privacyGroupId, besuPrivateKey) => {
  const contractOptions = {
    data: `${contractBinary}`,
    privateFrom: orionPrivateFrom,
    privacyGroupId: privacyGroupId,
    privateKey: besuPrivateKey
  };
  return web3.eea.sendRawTransaction(contractOptions);
};

const createPrivateContractNoPMT = (contractBinary, orionPrivateFrom, privacyGroupId, besuPrivateKey) => {
  const contractOptions = {
    data: `${contractBinary}`,
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
  return getPrivateTransactionReceipt(transactionHash, orionPrivateFrom).contractAddress;
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
  createPrivacyGroup,
  deletePrivacyGroup,
  findPrivacyGroupForNode,
  getPrivateNonce,
  getPublicNonce,
  sendPrivacyMarkerTransaction,
  createPrivateContract,
  createPrivateContractNoPMT,
  getPrivateTransactionReceipt,
  getPrivateContractAddress,
  getTransactionReceipt
};

if (require.main === module) {
  createPrivacyGroup();
}
