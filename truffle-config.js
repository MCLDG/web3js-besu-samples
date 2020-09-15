require('babel-register');
require('babel-polyfill');
require('dotenv').config();
// const HDWalletProvider = require('@truffle/hdwallet-provider')
// const privateKey = "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63";
// const privateKeyProvider = new HDWalletProvider(privateKey, "http://localhost:8545")

module.exports = {
    contracts_directory: "./contracts",
    networks: {
        besuWallet: {
            //provider: privateKeyProvider,       
            network_id: "*"
        },
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*', // eslint-disable-line camelcase
        },
        ganache: {
            host: 'localhost',
            port: 8545,
            network_id: '*', // eslint-disable-line camelcase
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(
                    process.env.MNEMONIC,
                    `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`
                )
            },
            gas: 5000000,
            gasPrice: 25000000000,
            network_id: 3
        }
    },
    // compilers: {
    //     external: {
    //         command: "solc Simple.sol --bin --abi --optimize --overwrite -o .",
    //         workingDirectory: "./contracts",
    //         targets: [{
    //             properties: {
    //                 contractName: "Simple",
    //             }
    //         }]
    //     }
    // }
    compilers: {
        solc: {
            version: "0.5.14",    // Fetch exact version from solc-bin (default: truffle's version)
            // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
            settings: {          // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
            //  evmVersion: "byzantium"
        }
    }
}