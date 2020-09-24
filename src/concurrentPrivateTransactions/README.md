# Besu concurrent private transactions
See the main README for details on pre-requisites, and how to compile the smart contracts.

Before running this example, make sure the Besu network has been started with the 
flag `PRIVACY_ONCHAIN_GROUPS_ENABLED=false`. This can be set by using the command
line argument below when starting the test network. Details in the main README:

```
cd besu-sample-networks
./clean.sh
./run-privacy.sh -c ibft2 -p offchain
```

You will need to wait 30-60s before executing any commands against the network.

## Deploy and execute the smart contract
Create a privacy group and deploy the smart contract to the privacy group. The application `deployGreeterToPrivacyGroup.js` will create the contract as a private contract, and retrieve the private contract address. 

```
cd src/deployContracts
node deployGreeterToPrivacyGroup.js
```

Send a batch of transactions to the smart contract. 

```
cd src/concurrentPrivateTransactions
node concurrentPrivateTransactions.js
```
