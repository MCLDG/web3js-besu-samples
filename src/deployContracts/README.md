# Deploy contracts to Besu
See the main README for details on pre-requisites, and how to compile the smart contracts.

Deploying the smart contracts is a pre-requisite to running the examples.

Before running this example, make sure the Besu network has been started with the appropriate `PRIVACY_ONCHAIN_GROUPS_ENABLED` flag. This will depend on whether you are using on-chain or off-chain privacy groups. This can be set by using the command line argument below when starting the test network. Details in the main README:

```
cd besu-sample-networks
./clean.sh
./run-privacy.sh -c ibft2 -p offchain
```

You will need to wait 30-60s before executing any commands against the network.

## Deploy the smart contracts
Each script in this folder deploys a smart contract, either a private smart contract to a privacy group, or a public smart contract. The following smart contracts are deployed using the scripts:

* deployContractToPrivacyGroup.js: deploy the contract Simple.sol privately.
* deployContractToPrivacyGroupTM.js: deploy the contract Simple.sol privately, while signing the private marker transaction using your own private key
* deployContractOnChainPrivacyGroup: deploy the contract Greeter.sol privately, to an on-chain privacy group.

As the smart contracts are deployed, metadata including contract address and (optional) privacy group ID are written to a file, '../contracts.yaml', which is then read by other scripts to obtain the required metadata.

## Example
Create a privacy group and deploy the smart contract to the privacy group. The application `deployContractToPrivacyGroup.js` will create the contract as a private contract, and retrieve the private contract address. 

```
cd src/deployContracts
node deployContractToPrivacyGroup.js
```

