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

deviceClient.on("connect", function(err, data) {
    rspiState.rasp = "online";
    console.log(rspiState);
});

//roConnect.connectAllSpheros();

spheroConnect.on("sphero_connected", function(mac, orb) {
    console.log("Sphero %s connected.", mac);
    macOrb[mac] = orb;
    rspiState.spheros[mac] = "connected";
});
spheroConnect.on("sphero_disconnected", function(mac, orb) {
    console.log("Sphero %s disconnected.", mac);
    delete macOrb[mac];
    if (rspiState.spheros[mac]) {
        rspiState.spheros[mac] = "disconnected";
    }
});
spheroControls.on("rolled", function(orb) {
    var mac = spheroConnect.getMac(orb.connection.conn);
    rspiState.spheros[mac] = "connected";
})

deviceClient.on("command", function (commandName, format, payload, topic) {
    console.log("got command: " + commandName);
    console.log("got: ");
    console.log("\tformat: " + format);
    console.log("\tpayload: " + payload);
    console.log("\ttopic: " + topic + "\nend command.\n");
    if (commandName == "roll") {
        var parameters = JSON.parse(payload)["params"];
        try {
            spheroControls.rollForTime(macOrb[parameters["mac"]], parameters["speed"], parameters["direction"], parameters["time"]);
            rspiState.spheros[parameters["mac"]] = "rolling";
            deviceClient.publish("spheroStatus", "json", JSON.stringify(rspiState));
        } catch (e) {
            console.error("ERROR: your throw sucks");
            console.error(e);
        }
    } else if (commandName == "calibrate") {
        var parameters = JSON.parse(payload)["params"];
        spheroControls.calibrateEnd(macOrb[parameters["mac"]]);
        rspiState.spheros[parameters["mac"]] = "calibrated";
    } else if (commandName == "getActiveSpheros") {
        try {
            deviceClient.publish("activeSpheros", "json", JSON.stringify(Object.keys(macOrb)));
        } catch (e) {
            console.error("ERROR: Got error message while tryin to list active spheros");
            console.error(e);
        };
    } else if (commandName == "pairToSphero" ) {
        var parameters = JSON.parse(payload)["params"];
        console.log(parameters);
        var mac = parameters["mac"];
        macOrb[mac] = spheroConnect.connectSpheroOnMac(mac);
        if (macOrb[mac]) {
            macOrb[mac].on("ready", function(){
                spheroControls.setColor(macOrb[mac], parameters["rgb"]);
                spheroControls.calibrateBegin(macOrb[mac]);
                rspiState.spheros[parameters["mac"]] = "in_calibration";
            });
        } else {
            var errorload = {};
            errorload.type = "pairToSpheroError";
            errorload.mac = mac;
            console.error("ERROR: Could not connect to Sphero %s.", mac)
            deviceClient.publish("errors", "json", JSON.stringify(errorload));
        }
    } else if (commandName == "requestStatus") {
        deviceClient.publish("spheroStatus", "json", JSON.stringify(rspiState));
    } else {
        console.log("no comprende");
    }
});
