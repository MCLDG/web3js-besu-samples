# Examples of getting event logs

Scripts:
- `subscribe.js` - subscribe to new logs sent to the contract using the HTTP polling API
- `subscribeWebSocket.js` - subscribe to new logs sent to the contract using the WebSocket pub-sub API
- `getPastLogs.js` - get historical logs

## Usage
Follow the instructions in ../multiNodePrivacyGroup/deployContractToPrivacyGroup.js to create the privacy group and deploy the smart contract.

Next, run `subscribe.js` or `subscribeWebSockets.js` to subscribe to logs for the contract. The script will print any past and incoming logs until exited.

Back in ../multiNodePrivacyGroup, run storeValueFromNode1 to update the stored value and emit a log entry. 

Each time you run the script, you should see a new log output from `subscribe.js`/`subscribeWebSocket.js`.

Finally, run `getPastLogs.js` for all of the logs sent to the contract.
