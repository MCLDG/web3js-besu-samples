# Besu privacy and permissions
This repo started life as https://github.com/PegaSysEng/web3js-eea. I removed all the web3-eea code and refactored the examples to use the web3-eea npm library, instead of using the library source code that is merged into the repo. I also removed all the extraneous folders to make this a simple demo of how to use Besu.

The goal is to show how to develop applications using Besu privacy and permissioning. This repo supports the following features:

* Create a privacy group and deploy a smart contract to the privacy group (see multiNodePrivacyGroup folder)
* Store values in a smart contract in the privacy group. Do this from different nodes (see multiNodePrivacyGroup folder)
* Retrieve values from a smart contract in the privacy group. Do this from different nodes (see multiNodePrivacyGroup folder)
* Use on-chain privacy groups, a new feature in Besu v1.4 (see onChainPrivacyGroup folder)
* Subscribe to log events (see eventLogs folder)


## Pre-requisites for Besu network
You'll need to run a multi-node Besu network.

```
git clone https://github.com/PegaSysEng/besu-sample-networks.git
cd besu-sample-networks
npm install
./run-privacy.sh -c ibft2
```

You will need to wait 30-60s before executing any commands against the network.

If you see an error like this `Error: Invalid JSON RPC response: ""`, wait a little longer.

Privacy in Besu can use Privacy Groups, where contracts and transactions are sent to groups of nodes,
and Besu handle the distribution to the nodes in the group. Privacy groups can either be on-chain
or off-chain. You'll need to start the Besu network in the right privacy mode, otherwise you may see an
error such as this:

```
(node:54723) UnhandledPromiseRejectionWarning: Error: Returned error: Method not enabled
```

If you see the error above, you may need to change the `-p` argument when starting the network
to either be onchain or offchain.

```
cd besu-sample-networks
./clean.sh
./run-privacy.sh -c ibft2 -p onchain
```

You can stop the Docker containers when you no longer need them:

```
./stop.sh 
```

You can remove the Docker images & containers when you no longer need them:

```
./remove.sh 
```

You can clean the Docker network without removing the images, ready to ./run-privacy again:

```
./remove.sh 
```

## Pre-requisites for the smart contract and app
Back in this repo.

To compile the smart contracts you'll need solc and web3j. Install as follows:

```
brew update
brew upgrade
sudo rm -rf /usr/local/Cellar/python/3.7.5
brew tap ethereum/ethereum
brew install solidity@5
solc --version
```

Web3j requires the Java JDK, so install this first:

```
brew cask install adoptopenjdk
```

Then install web3j. This is used to allow interaction with smart contracts from Java code.

```
brew tap web3j/web3j
brew install web3j
```

Install Truffle:

```
npm install -g truffle
```

## Compile the smart contract
Once the pre-requisites are installed you can compile the smart contracts. The JSON output (including abi and binary) can be found in the standard `build/contracts` folder:

```
truffle compile
```

TBD: Not necessary for most tests. Now generate the Besu web3j Java wrapper code:

```
web3j solidity generate -b ./Simple.bin -a ./Simple.abi -o ../../../../../ -p org.hyperledger.besu.tests.web3j.generated
ls -lR ../../../../../org
```

## Deploy and execute the smart contract
Details on how to deploy and execute the smart contracts can be found in each of the individual src folders.

## Getting started
Navigate to the multiNodePrivacyGroup folder, deploy a smart contract to a privacy group. Use the other scripts to interact with the smart contract, as documented in the README files in each folder.

## Troubleshooting
If you see this error:

```
Error: Invalid JSON RPC response: ""
```

It's possible that your Besu network is not ready to accept requests. It usually takes 30-60s after starting before the network is ready to process requests.