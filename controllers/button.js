var raspi = require('raspi-io');
var five = require('johnny-five');
var board = new five.Board({
  io: new raspi(),
  repl: false
});

module.exports = function(deviceClient) {
    board.on('ready', function() {
        var button = new five.Button('P1-15');
        button.on("press", function() {
            deviceClient.publish("gameState", "json", "{\"pocketButton\": \"pressed\"}");
            console.log("button pressed");
        });
    });
}
