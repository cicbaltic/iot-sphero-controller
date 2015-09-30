var raspi = require('raspi-io');
var five = require('johnny-five');
var board = new five.Board({
  io: new raspi(),
  repl: false
});

board.on('ready', function() {

  var blueLed = five.Led('P1-40');
  var redLed = five.Led('P1-12');
  var button = new five.Button('P1-15');

  redLed.off();

  button.on("press", function() {
      console.log("button pressed");
      blueLed.on();
      redLed.off();
      rollForTime("6886E7049835", 90, 0, 1500);

  });

  button.on("release", function() {
      console.log("button released");
      blueLed.off();
      redLed.on();
  });

});
