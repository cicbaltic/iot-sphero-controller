var sphero = require("sphero");
var fs = require("fs");

// contains mac sphero instances with mac-addresses as keys
var macOrb = {};
var portOrb = {};

function rfScan() {
    var portMac = {};
    var macPort = {};
    var commScan = String(require("child_process").execSync("rfcomm -a"));
    if (commScan === "" || commScan === undefined) {
        return { "portMac": portMac, "macPort": macPort };
    } else {
        var rfcomms = commScan.split("\n");
        for (var i = 0; i < rfcomms.length - 1; i++) {
            var rfcomm = String(rfcomms[i]).split(" ");
            var port = rfcomm[0].substring(0, rfcomm[0].length - 1);
            var mac = String(rfcomm[3]).replace(/:/g, "");
            portMac[port] = mac;
            macPort[mac] = port;
        }
        return { "portMac": portMac, "macPort": macPort }
    }
}

// Scans for open BlueTooth serial com ports
function scanBtPorts() {
    return Object.keys(rfScan()["portMac"]);
}

// Gets a mac address of device connected on a specific serial port
function getMac(port) {
    port = String(port);
    port = (port.indexOf("dev") == -1) ? port : port.substring(5);
    var scan = rfScan()["portMac"];
    return (scan[port] != undefined) ? scan[port] : false;
}

// Gets port the mac is connected on
function getPort(mac) {
    mac = String(mac);
    mac = (mac.indexOf(":") == -1) ? mac : mac.replace(/:/g, "");
    var scan = rfScan()["macPort"];
    return (scan[mac] != undefined) ? scan[mac] : false;
}

// Creates a sphero object instance on a specified port
function createOrb(port) {
    mac = String(getMac(port));
    if (macOrb[mac] != undefined) {
        delete macOrb[mac];
    }
    port = String(port);
    port = (port.indexOf("dev") == -1) ? ("/dev/" + port) : (port);
    if ( getMac(port) != false) {
        return sphero(port);
    } else {
        console.log("No sphero connected on port: %s", port)
        return false;
    }
}

// Creates a sphero object instance and connects it
function connectSpheroOnPort(port) {
    var orb = createOrb(port);
    var mac = getMac(port);
    if (orb != false) {
        orb.connect();
        delete macOrb[mac];
        macOrb[mac] = orb;
        return true;
    } else {
        return false;
    }
}

// Creates a sphero object instance and connects it
function connectSpheroOnMac(mac) {
    var orb = createOrb(getPort(mac));
    if (orb != false) {
        orb.connect();
        delete macOrb[mac];
        macOrb[mac] = orb;
        return macOrb[mac];
    } else {
        return false;
    }
}

// Disconnects a sphero with a specified mac address
function disconnectSpheroOnMac(mac) {
    try {
        macOrb[mac].disconnect(function(err, data) {
            delete macOrb[mac];
        });
        return true;
    } catch (e) {
        console.log("No sphero connected with a mac address of: " + mac)
        return false;
    }
}

// Disconnects a sphero with a specified port
function disconnectSpheroOnPort(port) {
    var mac = getMac(port);
    try {
        macOrb[mac].disconnect(function(err, data) {
            delete macOrb[mac];
        });
        return true;
    } catch (e) {
        console.log("No sphero connected on port: " + port);
        return false;
    }
}

// Attempts to reconnect a sphero
function reconnectSpheroOnMac(mac) {
    try {
        var port = macOrb[mac].connection.conn;
        macOrb[mac].disconnect(function(err, data) {
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
    reconnectSpheroOnMac: reconnectSpheroOnMac,
    connectSpheroOnMac: connectSpheroOnMac
}
