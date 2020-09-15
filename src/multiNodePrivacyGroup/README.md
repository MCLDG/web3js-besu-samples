# Besu private transactions
See the main README for details on pre-requisites, and how to compile the smart contracts.

Before running this example, make sure the Besu network has been started with the 
flag `PRIVACY_ONCHAIN_GROUPS_ENABLED=false`. This can be set by using the command
line argument below when starting the test network. Details in the main README:

```
cd besu-sample-networks
./clean.sh
./run-privacy.sh -c ibft2 -p offchain
```

## Deploy and execute the smart contract
Create a privacy group and deploy the smart contract to the privacy group. The application `deployContract*.js` will create the contract as a private contract, and retrieve the private contract address. The difference between the two deployContract*.js scripts can be found in the header comments.

```
cd src/multiNodePrivacyGroup
node deployContractToPrivacyGroup.js
```

Export the values that are returned when running the previous script:

```
 export CONTRACT_ADDRESS=0x4526be7db153e3c0488842a0b46368dc2fc26076
 export PRIVACY_GROUP_ID=TRJFQvFU+l/yuiIW2KWcTzVb2DRn/HDIEKDmDqotM9k=
```

Query the privacy groups and their transaction counts:

```
node metaPrivacyGroup.js
```

Get the values from the privacy groups:

```
node getValueFromNodes.js
```

Store a value using Node 1. Expect to see an error when trying to get the value from Node 3 (port 20004), as it is not a member in the privacy group and cannot take part in the private transactions:

```
node storeValueFromNode1.js
```

Try storing values using Node 2 & 3. Expect to see an error when trying to use Node 3 (port 20004):

```
node storeValueFromNode2.js
node storeValueFromNode3.js
```
