/**
 * Helper functions to read/write the config file storing smart contract metadata
 */
const fs = require("fs");
const path = require("path");
const yaml = require('js-yaml');

const readConfigFile = () => {
    let contracts;
    try {
        if (!fs.readFileSync(path.join(__dirname, "../contracts.yaml")))
            return;
        contracts = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "../contracts.yaml"), 'utf8'));
        console.log("Reading contracts information: \n", contracts);
    } catch (e) {
        console.log("Error reading contracts information. Deploy a contract first: ", e);
    }
    return contracts;
};

const writeToConfigFile = (jsonConfig) => {
    let contracts = yaml.safeDump(mergeJSON(readConfigFile(), jsonConfig));

    fs.writeFile(path.join(__dirname, "../contracts.yaml"), contracts, (err, result) => {
        if (err) {
            return console.error("Error writing contract details to file contracts.yaml: ", err);
        } else {
            console.log("Writing contracts information: ", contracts);
        }
    });
}

const mergeJSON = (json1, json2) => {
    return Object.assign({}, json1, json2);
};

module.exports = {
    readConfigFile,
    writeToConfigFile,
    mergeJSON
  };