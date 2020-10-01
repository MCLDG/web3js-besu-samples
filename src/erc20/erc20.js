const fs = require("fs");
const path = require("path");

const yaml = require('js-yaml');

const Web3 = require("web3");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

//const ethUtil = require("../src/custom-ethjs-util");
const { orion, besu } = require("../keys.js");

const tokenAbi = JSON.parse(fs.readFileSync(
    path.join(__dirname, "../../build/contracts/HumanStandardToken.json")
)).abi;

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

let contract;

const getBalance = (
    privateKey,
    privateFrom,
    privacyGroupId,
    contractAddress
) => {
    const functionAbi = contract._jsonInterface.find(element => {
        return element.name === "balanceOf";
    });

    const besuAccount = web3.eth.accounts.privateKeyToAccount(
        `0x${privateKey}`
    )
        .address;

    // const balanceOf = `0x${ethUtil
    //     .privateToAddress(Buffer.from(privateKey, "hex"))
    //     .toString("hex")}`;
    const functionArgs = web3.eth.abi
        .encodeParameters(functionAbi.inputs, [besuAccount])
        .slice(2);

    const functionCall = {
        to: contractAddress,
        data:
            functionArgs !== null
                ? functionAbi.signature + functionArgs
                : functionAbi.signature,
        privateFrom: privateFrom,
        privacyGroupId: privacyGroupId,
        privateKey: privateKey
    };

    return web3.eea.sendRawTransaction(functionCall)
        .then(transactionHash => {
            console.log(`Transaction Hash ${transactionHash}`);
            return web3.priv.getTransactionReceipt(
                transactionHash,
                orion.node1.publicKey
            );
        })
        .then(privateTransactionReceipt => {
            if (privateTransactionReceipt.logs.length > 0) {
                console.log(privateTransactionReceipt.logs[0]);
            }
            console.log(`GOT Value of account ${besuAccount}:`, privateTransactionReceipt.output, ', DECIMAL', parseInt(privateTransactionReceipt.output, 16));
            return privateTransactionReceipt.output;
        })
        .catch(e => {
            console.log(e);
        });
}

const getBalanceSync = (
    privateKey,
    privateFrom,
    privacyGroupId,
    contractAddress
) => {
    const besuAccount = web3.eth.accounts.privateKeyToAccount(
        `0x${privateKey}`
    )
        .address;

    const functionAbi = contract._jsonInterface.find(e => {
        return e.name === "balanceOf";
    });

    const functionArgs = web3.eth.abi
        .encodeParameters(functionAbi.inputs, [besuAccount])
        .slice(2);

    const functionCall = {
        to: contractAddress,
        data:
            functionArgs !== null
                ? functionAbi.signature + functionArgs
                : functionAbi.signature,
        privateFrom: privateFrom,
        privacyGroupId: privacyGroupId,
        privateKey: privateKey
    };

    return web3.priv.call(functionCall).then(result => {
        console.log(`GOT Value of account ${besuAccount}: HEX`, result, ', DECIMAL', parseInt(result, 16));
        return result;
    });
};


const transferTo = (
    privateKeyFrom,
    privateKeyTo,
    privateFrom,
    privacyGroupId,
    contractAddress,
    transferValue
) => {
    const functionAbi = contract._jsonInterface.find(element => {
        return element.name === "transfer";
    });

    const besuAccountFrom = web3.eth.accounts.privateKeyToAccount(
        `0x${privateKeyFrom}`
    )
        .address;

    const besuAccountTo = web3.eth.accounts.privateKeyToAccount(
        `0x${privateKeyTo}`
    )
        .address;

    console.log(`transferTo of value ${transferValue} from account ${besuAccountFrom}, to account ${besuAccountTo}`);

    const functionArgs = web3.eth.abi
        .encodeParameters(functionAbi.inputs, [besuAccountTo, transferValue])
        .slice(2);

    const functionCall = {
        to: contractAddress,
        data:
            functionArgs !== null
                ? functionAbi.signature + functionArgs
                : functionAbi.signature,
        privateFrom: privateFrom,
        privacyGroupId: privacyGroupId,
        privateKey: privateKeyFrom
    };

    return web3.eea.sendRawTransaction(functionCall)
        .then(transactionHash => {
            console.log(`Transaction Hash ${transactionHash}`);
            return web3.priv.getTransactionReceipt(
                transactionHash,
                orion.node1.publicKey
            );
        })
        .then(privateTransactionReceipt => {
            console.log("Private Transaction Receipt");
            console.log(privateTransactionReceipt);
            if (privateTransactionReceipt.logs.length > 0) {
                console.log(privateTransactionReceipt.logs[0]);
            }
            return privateTransactionReceipt;
        })
        .catch(e => {
            console.log(e);
        });
}

module.exports = async () => {
    const yamlContracts = configFileHandler.readConfigFile();

    const privacyGroupId = yamlContracts.privateTokenContract.privacyGroupId;
    const tokenContractAddress = yamlContracts.privateTokenContract.contractAddress;
    console.log("Contracts information. privacyGroupId: ", privacyGroupId);
    console.log("Contracts information. Address: ", tokenContractAddress);

    contract = new web3.eth.Contract(tokenAbi, tokenContractAddress);

    // Get the balance. The token was deployed by node 1 with an initial balance of 1,000,000
    // Use both sync and async functions
    await getBalance(
        besu.node1.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );
    await getBalanceSync(
        besu.node2.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );
    await getBalance(
        besu.node3.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );

    // Transfer
    await transferTo(
        besu.node1.privateKey,
        besu.node2.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
        100
    );

    // Get the balance. 100 should have been transferred to node 2
    await getBalanceSync(
        besu.node1.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );
    await getBalance(
        besu.node2.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );
    await getBalanceSync(
        besu.node3.privateKey,
        orion.node1.publicKey,
        privacyGroupId,
        tokenContractAddress,
    );
}

if (require.main === module) {
    module.exports().catch(error => {
        console.log(error);
        console.log(
            "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
        );
    });
}