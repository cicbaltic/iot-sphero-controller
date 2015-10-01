var spheroControl = require("./controllers/spheroControls");
var macOrb = spheroControl.macOrb;

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


deviceClient.on("command", function (commandName,format,payload,topic) {
    console.log("got command: " + commandName);
    console.log("got: ");
    console.log("\tformat: " + format);
    console.log("\tpayload: " + payload);
    console.log("\ttopic: " + topic + "\nend command.\n");
    if (commandName == "roll") {
        var parameters = JSON.parse(payload)["params"];
        try {
            spheroControl.rollForTime(parameters["mac"], parameters["speed"], parameters["direction"], parameters["time"]);
            deviceClient.publish("activeSpheros", "json", "{'moved': 'correct'}");
        } catch (e) {
            console.log("your throw sucks");
            console.log(e);
        }
    } else if (commandName == "calibrate") {
        var parameters = JSON.parse(payload)["params"];
        spheroControl.calibrate(parameters["mac"]);
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
