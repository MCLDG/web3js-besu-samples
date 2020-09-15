const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const privacyGroup = require("../privacyGroupManagement/manageOnChainPrivacyGroup");

const { orion, besu } = require("../keys.js");

const greeterBinary = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/greeter.json")
)).bytecode;

const greeterAbi = JSON.parse(fs.readFileSync(
  path.join(__dirname, "../../build/contracts/greeter.json")
)).abi;

const web3Node1 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);

const createGreeterContract = privacyGroupId => {
  const contractOptions = {
    data: `0x${greeterBinary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3Node1.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  return web3Node1.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      return privateTransactionReceipt.contractAddress;
    });
};

const callGenericFunctionOnContract = (
  web3,
  privateFrom,
  privateKey,
  address,
  privacyGroupId,
  method,
  value
) => {
  const contract = new web3.eth.Contract(greeterAbi);

  // eslint-disable-next-line no-underscore-dangle
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === method;
  });

  const functionArgs =
    value !== null
      ? web3.eth.abi.encodeParameters(functionAbi.inputs, [value]).slice(2)
      : null;

  const functionCall = {
    to: address,
    data:
      functionArgs !== null
        ? functionAbi.signature + functionArgs
        : functionAbi.signature,
    privateFrom,
    privateKey,
    privacyGroupId
  };
  return web3.eea
    .sendRawTransaction(functionCall)
    .then(privateTxHash => {
      console.log("Transaction Hash:", privateTxHash);
      return web3.priv.getTransactionReceipt(privateTxHash, privateFrom);
    })
    .then(result => {
      return result;
    });
};

module.exports = async () => {

  console.log("Creating on-chain privacy group");
  const privacyGroupId = await privacyGroup.createPrivacyGroup([orion.node1.publicKey, orion.node2.publicKey]);
  console.log("Created new on-chain privacy group with ID:", privacyGroupId);

  console.log("Deploying greeter smart contract to privacy group: ", privacyGroupId);
  const greeterContractAddress = await createGreeterContract(
    privacyGroupId
  ).then(res => {
    return getPrivateContractAddress(res);
  });
  console.log("greeter smart contract deployed at address: ", greeterContractAddress);

  // TODO - is not working at present
  const contract = new web3Node1.eth.Contract(greeterAbi, greeterContractAddress);
  await contract.events.allEvents({
    fromBlock: 0
  }, function (error, event) { console.log(`Approval event `, event); })
    .on('data', function (event) {
      console.log(`Approval event in on part `, event); // same results as the optional callback above
    })
    .on('changed', function (event) {
      // remove event from local database
    })
    .on('error', console.error);

  // Send a greeting from node1
  const callGreetFunctionResult = await callGenericFunctionOnContract(
    web3Node1,
    orion.node1.publicKey,
    besu.node1.privateKey,
    greeterContractAddress,
    privacyGroupId,
    "greet",
    null
  ).then(r => {
    return r;
  });

  console.log(`Send a greeting from node1: `, callGreetFunctionResult);

  // Return the greeting from node2
  const callSetGreetingFunctionResultFromSecondParticipant = await callGenericFunctionOnContract(
    web3Node2,
    orion.node2.publicKey,
    besu.node2.privateKey,
    greeterContractAddress,
    privacyGroupId,
    "setGreeting",
    "test"
  ).then(r => {
    return r;
  });

  console.log(`Return the greeting from node2: `, callSetGreetingFunctionResultFromSecondParticipant);

  // Emit the approval event
  const callFireEventFunctionResult = await callGenericFunctionOnContract(
    web3Node1,
    orion.node1.publicKey,
    besu.node1.privateKey,
    greeterContractAddress,
    privacyGroupId,
    "fire",
    null
  ).then(r => {
    return r;
  });

  console.log(`Emit the approval event: `, callFireEventFunctionResult);

//  setTimeout(() => console.log('Waiting for event'), 5000);

};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
