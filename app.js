var Client = require("ibmiotf").IotfDevice;
var sphero = require("sphero");
var fs = require("fs");


// scan for connected bluetooth devices
var btConnections = [];
var files = fs.readdirSync("/dev");
for(var i = 0; i <= files.length; i++) {
    var file = String(files[i]);
    if (file.substring(0, 6) == "rfcomm") {
        btConnections.push(file);
    }
};

// instantiate sphero objects
var orbs = [];
for (var i = 0; i < btConnections.length; i++) {
    try {
        var orb = sphero("/dev/" + btConnections[i]);
        orbs.push(orb);
    } catch (e) {
        console.log(e);
    }
}

// connect to activeSpheros

for (var i = 0; i < orbs.length; i++) {
    try {
        var j = i;
        orbs[j].connect(function() {
            console.log("connected to an orb on: " + btConnections[j]);
            var btData;
            orbs[j].getBluetoothInfo(function(err, data) {
                var mac = "";
                btData = data.data;
                for (var i = 16; i < 28; i++) {
                    mac += String.fromCharCode(btData[i]).toUpperCase();
                }
                orbs[j]["macAddress"] = mac;
            });
        });
    } catch (e) {
        console.log("errors while connecting to orbs");
        console.log(e);
    }
}

setTimeout(function() {
    console.log(orbs[0].macAddress);
}, 5000);

// creates table for pairing spheros to userNames
var spheroHash = {};
function addPlayer(name) {
    var currPlayers = Object.keys(spheroHash);
    for (var i = 0; i < currPlayers.length; i++) {
        //if
    }
};

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

function getSpheroMacs(orbs) {
    var macs = [];
    for (var i = 0; i < orbs.length; i++) {
        macs.push(orbs[i]["macAddress"]);
    }
    return macs;
};

deviceClient.on("command", function (commandName,format,payload,topic) {
    console.log("got command: " + commandName);
    console.log("got: ");
    console.log("\tformat: " + format);
    console.log("\tpayload: " + payload);
    console.log("\ttopic: " + topic);
    if (commandName == "roll") {
        try {
            var funct = JSON.parse(payload)["function"];
            deviceClient.publish("activeSpheros", "json", "{'moved': 'correct'}");
            eval(funct);
        } catch (e) {
            console.log("Got error message while tryin to parse command: ");
            console.log(e)
        }
    } else if (commandName == "getActiveSpheros") {
        try {
            deviceClient.publish("activeSpheros", "json", JSON.stringify(getSpheroMacs(orbs)));
        } catch (e) {
            console.log("Got error message while tryin to list active spheros");
            console.log(e);
        };
    } else if (commandName == "pairToSphero" ) {

    } else {
        console.log("no comprende");
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
