# Besu private transactions
See the main README for details on pre-requisites, and how to compile the smart contracts.

Before running this example, make sure the Besu network has been started with the 
flag `PRIVACY_ONCHAIN_GROUPS_ENABLED=true`. This can be set by using the command
line argument below when starting the test network. Details in the main README:

```
cd besu-sample-networks
./clean.sh
./run-privacy.sh -c ibft2 -p onchain
```

You will need to wait 30-60s before executing any commands against the network.

## Deploy and execute the smart contract
Create the on-chain privacy group and deploy the ERC20 smart contract to the privacy group. The application `deployTokenOnChainPrivacyGroup.js` will create the contract as a private contract, and retrieve the private contract address. 

```
cd src/deployContracts
node deployTokenOnChainPrivacyGroup.js
```

Execute the smart contract functions:

```
cd erc20
node erc20.js
```

On chain privacy groups have dynamic membership. Now add & remove nodes to the on-chain privacy group:

```
node addRemoveNodes.js
```

Call the smart contract again and see the differences:

```
cd erc20
node erc20.js
```

