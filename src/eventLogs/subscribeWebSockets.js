const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("web3-eea");

const configFileHandler = require("../config/configFileHandler");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.wsUrl), 2018);

async function run() {
  const yamlContracts = configFileHandler.readConfigFile();

  const privacyGroupId = yamlContracts.privateSimpleContract.privacyGroupId;
  const address = yamlContracts.privateSimpleContract.contractAddress;
  console.log("Contracts information. privacyGroupId: ", privacyGroupId);
  console.log("Contracts information. Address: ", address);

  const filter = {
    address
  };

  console.log("Installing filter", filter);

  // Create subscription
  return node.priv
    .subscribe(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("Installed filter", result);
      } else {
        console.error("Problem installing filter:", error);
        throw error;
      }
    })
    .then(async subscription => {
      // Add handlers for incoming events
      subscription
        .on("data", log => {
          if (log.result != null) {
            // Logs from subscription are nested in `result` key
            console.log("LOG =>", log.result);
          } else {
            console.log("LOG =>", log);
          }
        })
        .on("error", console.error);

      // Unsubscribe and disconnect on interrupt
      process.on("SIGINT", async () => {
        console.log("unsubscribing");
        await subscription.unsubscribe((error, success) => {
          if (!error) {
            console.log("Unsubscribed:", success);
          } else {
            console.error("Failed to unsubscribe:", error);
          }

          node.currentProvider.disconnect();
        });
      });

      return subscription;
    })
    .catch(error => {
      console.error(error);
    });
}

run();
