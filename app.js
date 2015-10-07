var SpheroControls = require("./controllers/spheroControls");
var SpheroConnect = require("./controllers/connect");

var ButtonControl = require("./controllers/button");

var Client = require("ibmiotf").IotfDevice;

var rspiState = {
    "rasp": "offline", // online/offline
    "spheros": {
        //"sphero0": "disconnected", // diconnected/connected/in_calibration/calibrated/rolling
        //"sphero1": "disconnected", // diconnected/connected/in_calibration/calibrated/rolling
        //...
    }
};

// always capture, log and exit on uncaught exceptions
// your production system should auto-restart the app
// this is the Node.js way
process.on('uncaughtException', function(err) {
  console.error('ERROR: uncaughtException:', err.message);
  console.error(err.stack);
  //process.exit(1);
});

var config = {
  "org" :         "wjhtfb",
  "id" :          "sphero-g",
  "type" :        "sphero",
  "auth-method" : "token",
  "auth-token" :  "spheroYraZalias"
};

var deviceClient = new Client(config);
deviceClient.connect();
var button = new ButtonControl(deviceClient);

var spheroConnect = new SpheroConnect();
var spheroControls = new SpheroControls();

var macOrb = {};

function changeSpheroState(mac, state) {
  if (mac) {
    rspiState.spheros[mac] = state;
  }

  console.log(rspiState);
  deviceClient.publish("status", "json", JSON.stringify(rspiState));
}

deviceClient.on("connect", function(err, data) {
  rspiState.rasp = "online";
  console.log(rspiState);
});

spheroConnect.on("sphero_connected", function(mac, orb) {
  console.log("Sphero %s connected.", mac);

  macOrb[mac] = orb;
  changeSpheroState(mac, "connected");

  spheroControls.startCollisionDetection(macOrb[mac], mac);
});

spheroConnect.on("sphero_disconnected", function(mac, orb) {
  console.log("Sphero %s disconnected.", mac);
  delete macOrb[mac];
  changeSpheroState(mac, "disconnected");
});

spheroControls.on("rolled", function(orb) {
  var mac = spheroConnect.getMac(orb.connection.conn);
  changeSpheroState(mac, "connected");
});

spheroControls.on("collision", function(data, mac) {
  console.log("collision detected on Sphero " + mac);
  console.log(JSON.stringify(data));
});

deviceClient.on("command", function (commandName, format, payload, topic) {
  console.log("got command: " + commandName);
  console.log("got: ");
  console.log("\tformat: " + format);
  console.log("\tpayload: " + payload);
  console.log("\ttopic: " + topic + "\nend command.\n");

  if (commandName == "roll") {
    var parameters = JSON.parse(payload).params;
    try {
      spheroControls.rollForTime(macOrb[parameters.mac], parameters.speed, parameters.direction, parameters.time);
      rspiState.spheros[parameters.mac] = "rolling";
    } catch (e) {
      console.error("ERROR: your throw sucks");
      console.error(e);
  }
  } else if (commandName == "calibrate") {
    var parameters = JSON.parse(payload).params;
    spheroControls.calibrateEnd(macOrb[parameters.mac]);

    rspiState.spheros[parameters.mac] = "calibrated";
  } else if (commandName == "getActiveSpheros") {
      try {
          deviceClient.publish("activeSpheros", "json", JSON.stringify(Object.keys(macOrb)));
      } catch (e) {
          console.error("ERROR: Got error message while tryin to list active spheros");
          console.error(e);
      }
  } else if (commandName == "pairToSphero" ) {
      var parameters = JSON.parse(payload).params;
      console.log(parameters);
      var mac = parameters.mac;
      macOrb[mac] = spheroConnect.connectSpheroOnMac(mac);
      if (macOrb[mac]) {
          macOrb[mac].on("ready", function(){
              spheroControls.setColor(macOrb[mac], parameters.rgb);
              spheroControls.calibrateBegin(macOrb[mac]);
              rspiState.spheros[parameters.mac] = "in_calibration";
          });
      } else {
        console.error("ERROR: Could not connect to Sphero %s.", mac);
        changeSpheroState(mac, "disconnected");
      }
  } else if (commandName == "getStatus") {
      console.log("GetStatus command received.")
      changeSpheroState();
  } else {
      console.error("ERROR: Uknown command received:" + payload);
  }
});
