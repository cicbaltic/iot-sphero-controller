var raspi = require('raspi-io');
var five = require('johnny-five');
var board = new five.Board({
  io: new raspi(),
  repl: false
});

module.exports = function(deviceClient) {
    var publish = function(slot) {
        var payload = {
            "type": "gameEnd",
            "message": {
                "slot": slot,
                "timeStamp": new Date().getTime()
            }
        };
        deviceClient.publish("gameState", "json", JSON.stringify(payload));
        console.log("button %s pressed", slot);
    };

    board.on('ready', function() {
        var button15 = new five.Button('P1-15');
        button15.on("press", function() {
            publish(0);
        });
        var button13 = new five.Button('P1-13');
        button13.on("press", function() {
            publish(1);
        });
    });
}
