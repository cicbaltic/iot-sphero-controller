var spheroControls = require("./controllers/spheroControls");
var SpheroConnect = require("./controllers/connect");

var ButtonControl = require("./controllers/button");

var Client = require("ibmiotf").IotfDevice;

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
var macOrb = {};

//roConnect.connectAllSpheros();

spheroConnect.on("sphero_connected", function(mac, orb) {
    console.log("Sphero %s connected.", mac);
    macOrb[mac] = orb;
});
spheroConnect.on("sphero_disconnected", function(mac, orb) {
    console.log("Sphero %s disconnected.", mac);
    delete macOrb[mac];
});

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
            deviceClient.publish("spheroStatus", "json", "{\"action\": \"rolling\"}");
        } catch (e) {
            console.error("ERROR: your throw sucks");
            console.error(e);
        }
    } else if (commandName == "calibrate") {
        var parameters = JSON.parse(payload)["params"];
        spheroControls.calibrateEnd(macOrb[parameters["mac"]]);
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
            });
        } else {
            var errorload = {};
            errorload.type = "pairToSpheroError";
            errorload.mac = mac;
            console.error("ERROR: Could not connect to Sphero %s.", mac)
            deviceClient.publish("errors", "json", JSON.stringify(errorload));
        }
    } else {
        console.log("no comprende");
    }
});
