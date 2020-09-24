const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.url), 2018);

async function run() {
  const yamlContracts = configFileHandler.readConfigFile();

  const privacyGroupId = yamlContracts.privateSimpleContract.privacyGroupId;
  const address = yamlContracts.privateSimpleContract.contractAddress;
  console.log("Contracts information. privacyGroupId: ", privacyGroupId);
  console.log("Contracts information. Address: ", address);

  const filter = {
    address
  };

  // Set the polling interval to something fairly high
  node.priv.subscriptionPollingInterval = 5000;

  console.log("Installing filter", filter);

  // Create subscription
  return node.priv
    .subscribe(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("Installed filter", result);
      } else {
        console.error("Problem installing filter", error);
        throw error;
      }
    })
    .then(subscription => {
      // Add handler for each log received
      subscription
        .on("data", log => {
          console.log("LOG =>", log);
        })
        .on("error", console.error);

      // Unsubscribe on interrupt
      process.on("SIGINT", async () => {
        console.log("unsubscribing");
        await subscription.unsubscribe((error, success) => {
          if (!error) {
            console.log("Unsubscribed:", success);
          } else {
            console.log("Failed to unsubscribe:", error);
          }
        });
      });

      return subscription;
    });
}

run();
