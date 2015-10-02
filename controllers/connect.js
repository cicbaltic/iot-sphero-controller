var sphero = require("sphero");
var fs = require("fs");

// contains mac sphero instances with mac-addresses as keys
var macOrb = {};

// Scans for open BlueTooth serial com ports
function scanBtPorts() {
    var files = fs.readdirSync("/dev");
    var btPorts = [];
    for(var i = 0; i <= files.length; i++) {
        var file = String(files[i]);
        if (file.substring(0, 6) == "rfcomm" && getMac(String(file)) != false) {
            btPorts.push(file);
        }
    };
    return btPorts;
}

// Gets a mac address of device connected on a specific serial port
function getMac(port) {
    port = (port.indexOf("dev") == -1) ? port : port.substring(5);
    var result = String(require("child_process").execSync("rfcomm -a"));
    if (result == "" || port === undefined) {
        return false;
    } else {
        var arr = result.split("\n");
        for (var i = 0; i < arr.length; i++) {
            var arr2 = String(arr[i]).split(/ /g);
            if (String(port) + ":" === String(arr2[0])) {
                return arr2[3].replace(/:/g, "");
            }
        }
        return false;
    }
}

function getPort(mac) {
    var result = String(require("child_process").execSync("rfcomm -a"));
    var arr = result.split("\n");
    for (var i = 0; i < arr.length; i++) {
        var arr2 = String(arr[i]).split(/ /g);
        var innerMac = arr2[3].replace(/:/g, "");
        if (String(mac) === String(innerMac)) {
            return arr2[0].substring(0, arr2[0].length - 1);
        }
    }
    return false;
}

// Creates a sphero object instance on a specified port
function createOrb(port) {
    return sphero( (port.indexOf("dev") == -1) ? ("/dev/" + port) : (port) );
}

// Creates a sphero object instance and connects it
function connectSpheroOnPort(port) {
    var newOrb = createOrb(port);
    var mac = getMac(port);
    if (mac === false) {
        return;
    } else {
        macOrb[mac] = newOrb;
        try {
            macOrb[mac].connect(function(err, data) {
                console.log("Sphero (%s) on port %s has been connected successfully.", mac, port);
            });
        } catch (e) {
            console.log("Couldn't connect, maybe try again later?");
            console.log(e);
        }
    }
}

// Disconnects a sphero with a specified mac address
function disconnectSpheroOnMac(mac) {
    try {
        macOrb[mac].disconnect(function(err, data) {
            delete macOrb[mac];
        });
    } catch (e) {
        console.log("No sphero connected with a mac address of: " + mac)
    }
}

// Attempts to reconnect a sphero
function reconnectSpheroOnMac(mac) {
    try {
        macOrb[mac].disconnect(function(err, data) {
            var port = macOrb[mac].connection.conn;
            delete macOrb[mac];
            connectSpheroOnPort(port);
        });
    } catch (e) {
        console.log("No sphero connected with a mac address of: " + mac + "\nAttempting a connection...");
        connectSpheroOnPort(getPort(mac));
    }
}

// Connects all available spheros
function connectAllSpheros() {
    var ports = scanBtPorts();
    for (var i = 0; i < ports.length; i++) {
        var port = ports[i];
        var mac = getMac(ports[i]);
        console.log(mac + " " + port);
        if (macOrb[mac] === undefined || macOrb[mac] === {}) {
            connectSpheroOnPort(port);
        } else {
            reconnectSpheroOnMac(mac);
        }
    }
    return macOrb;
}

module.exports = {
    connectAllSpheros: connectAllSpheros,
    scanBtPorts: scanBtPorts,
    reconnectSpheroOnMac: reconnectSpheroOnMac
}
