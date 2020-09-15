const Web3 = require("web3");
const EEAClient = require("web3-eea");

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
function getPublicNonce(account) {
  return web3.eth.getTransactionCount(account, "pending");
}

module.exports = {
  createPrivacyGroup,
  deletePrivacyGroup,
  findPrivacyGroupForNode,
  getPrivateNonce,
  getPublicNonce
};

if (require.main === module) {
  createPrivacyGroup();
}
