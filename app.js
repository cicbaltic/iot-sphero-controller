var Client = require("ibmiotf").IotfDevice;
var sphero = require("sphero");
//var orb = sphero("/dev/rfcomm1");
//    orb.connect();

var orb2 = sphero("/dev/rfcomm0");
    orb2.connect();

var rollInterval;

function rollForTime(orb, speed, direction, time) {
    if (rollInterval) {
        clearInterval(rollInterval);
        orb.roll(0, direction);
    }
    if (time > 1000) {
        rollInterval = setInterval(function() {
            orb.roll(speed, direction);
        }, 500);
        setTimeout(function() {
            clearInterval(rollInterval);
            orb.roll(0, direction);
        }, time);
    } else {
        orb.roll(speed, direction);
        setTimeout(function() {
            orb.roll(0, direction);
        }, time);
    }
};

//
var config = {
  "org" :         "wjhtfb",
  "id" :          "sphero-g",
  "type" :        "sphero",
  "auth-method" : "token",
  "auth-token" :  "spheroYraZalias"
};

var deviceClient = new Client(config);

deviceClient.connect();

// deviceClient.on("connect", function() {
//     console.log("connected..");
//     var status = {};
//     var innerStatus = {};
//     innerStatus["health"] = "okay";
//     status["d"] = innerStatus;
//     setInterval(function() {
//         deviceClient.publish("status", "json", JSON.stringify(status));
//         console.log("published health status\n" + JSON.stringify(status));
//     }, 9999);
//
// });

deviceClient.on("command", function (commandName,format,payload,topic) {
    console.log("got command: " + commandName);
    console.log("got payload: " + payload);
    try {
        var funct = JSON.parse(payload)["function"];
        eval(funct);
    } catch (e) {
        console.log("Got error message while tryin to parse command: ");
        console.log(e)
    }
});

/*
Cylon.robot({
  connections: {
    rpi: { adaptor: 'raspi' },
    iotf: { adaptor: "mqtt", host: "ssl://43ev6f.messaging.internetofthings.ibmcloud.com:8883", clientId:"d:43ev6f:raSphero:sphero1", username: "use-token-auth", password: "spheroYraZalias" },
    //iotf1: { adaptor: "mqtt", host: "ssl://8txj53.messaging.internetofthings.ibmcloud.com:8883", clientId:"d:8txj53:endpoint-device-controller:enpoint-device-rpi2", username: "use-token-auth", password: "a-43ev6f-ebwyeact41" },
  },

  devices: {
    hello: { driver: 'mqtt', topic: 'iot-2/evt/hello/fmt/json', connection: 'iotf' },
    toggle: { driver: 'mqtt', topic: 'iot-2/cmd/blink/fmt/json', adaptor: 'mqtt', connection: 'iotf'},
    button_led: { driver: 'led', pin: 12, connection: 'rpi'},
    button:     { driver: 'button', pin: 15, connection: 'rpi'},
    connect_led:{ driver: 'led', pin: 40, connection: 'rpi'}
  },

  work: function(my) {
    my.connect_led.toggle();

    my.hello.publish(JSON.stringify({
        "d": {"msg": "Hello World"}
    }));

    my.button.on('push', function(){
      my.button_led.turnOn();
      my.hello.publish(JSON.stringify({
        "d": {"msg": "Button pushed"}
      }));
    });

    my.button.on('release', function(){
      my.button_led.turnOff();
      my.hello.publish(JSON.stringify({
        "d": {"msg": "Button released"}
      }));
    });

    my.toggle.on('message', function() {
      my.connect_led.toggle();
    });
  }
}).start();
*/
