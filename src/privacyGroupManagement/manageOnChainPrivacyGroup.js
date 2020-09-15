const Web3 = require("web3");
const EEAClient = require("web3-eea");

const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const createPrivacyGroup = (addresses) => {

  // v0.9 of web3-eea requires a privacyGroupId to be generated before creating the privacy group
  // In v0.10 the createPrivacyGroup function will generate the privacyGroupId if not provided

  const contractOptions = {
    participants: addresses,
    enclaveKey: orion.node1.publicKey,
    privateKey: besu.node1.privateKey
  };

  // The privacy group is created on chain, by calling a smart contract embedded into Besu. The result
  // returned is therefore a standard smart contract transaction response
  return web3.privx.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created for nodes ${addresses} is:`, result.privacyGroupId);
    return result.privacyGroupId;
  });
};

const findOnChainPrivacyGroup = (addresses) => {
  const contractOptions = {
    addresses: addresses
  };
  return web3.privx.findOnChainPrivacyGroup(contractOptions)
    .then(result => {
      return result;
    });
};

module.exports = {
  createPrivacyGroup,
  findOnChainPrivacyGroup
};

if (require.main === module) {
  createPrivacyGroup();
}
