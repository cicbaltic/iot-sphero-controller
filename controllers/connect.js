"use strict";
/*jshint node:true*/

var util = require("util");
var EventEmitter = require("events").EventEmitter;

var sphero = require("sphero");

function SpheroConnectController() {
    var self = this;

    EventEmitter.call(this);

    // contains mac sphero instances with mac-addresses as keys
    this.orbsByMac = {};
    this.portOrb = {};

    this.rfScan = function rfScan() {
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
            return { "portMac": portMac, "macPort": macPort };
        }
    };

    // Scans for open BlueTooth serial com ports
    this.scanBtPorts = function scanBtPorts() {
        return Object.keys(this.rfScan().portMac);
    };

    // Gets a mac address of device connected on a specific serial port
    this.getMac = function getMac(port) {
        port = String(port);
        port = (port.indexOf("dev") === -1) ? port : port.substring(5);
        var scan = this.rfScan().portMac;
        return scan[port] ? scan[port] : false;
    };

    // Gets port the mac is connected on
    this.getPort = function getPort(mac) {
        mac = String(mac);
        mac = (mac.indexOf(":") === -1) ? mac : mac.replace(/:/g, "");
        var scan = this.rfScan().macPort;
        return scan[mac] ? scan[mac] : false;
    };

    // Creates a sphero object instance on a specified port
    this.createOrb = function createOrb(port) {
        var mac = String(this.getMac(port));
        if (this.orbsByMac.mac) {
            delete this.orbsByMac[mac];
        }
        port = String(port);
        port = (port.indexOf("dev") === -1) ? ("/dev/" + port) : (port);
        if ( this.getMac(port) !== false) {
            return sphero(port);
        } else {
            console.log("No sphero connected on port: %s", port);
            return null;
        }
    };

    // Creates a sphero object instance and connects it
    this.connectSpheroOnPort = function connectSpheroOnPort(port) {
        var orb = this.createOrb(port);
        var mac = this.getMac(port);
        if (orb) {
            orb.connect();
            orb.on("ready", function() {
                self.emit("sphero_connected", mac, orb);
            });
            delete this.orbsByMac[mac];
            this.orbsByMac[mac] = {orb: orb, mac: mac, ttl: 0};
            return true;
        } else {
            return false;
        }
    };

    // Creates a sphero object instance and connects it
    this.connectSpheroOnMac = function connectSpheroOnMac(mac) {
        var orb = this.createOrb(this.getPort(mac));
        if (orb !== false && this.getPort(mac) !== false) {
            orb.connect();
            orb.on("ready", function() {
                self.emit("sphero_connected", mac, orb);
            });
            delete this.orbsByMac[mac];
            this.orbsByMac[mac] = {orb: orb, mac: mac, ttl: 0};
            return this.orbsByMac[mac].orb;
        } else {
            return null;
        }
    };

    // Disconnects a sphero with a specified mac address
    this.disconnectSpheroOnMac = function disconnectSpheroOnMac(mac) {
        var orb = self.orbsByMac[mac].orb;
        delete self.orbsByMac[mac];
        self.emit("sphero_disconnected", mac);
        try {
            orb.disconnect(function(err, data) {
              if (err) {
                console.error("ERROR: Unable to disconnect: " + mac + ": " + err);
              }
            });
        } catch (e) {
            console.error("ERROR: Unable to disconnect: " + mac + ": " + e);
        }
    };

    // Disconnects a sphero with a specified port
    this.disconnectSpheroOnPort = function disconnectSpheroOnPort(port) {
        var mac = this.getMac(port);
        try {
            this.orbsByMac[mac].orb.disconnect(function(err, data) {
                delete self.orbsByMac[mac];
                self.emit("sphero_disconnected", mac);
            });
            return true;
        } catch (e) {
            console.log("No sphero connected on port: " + port);
            return false;
        }
    };

    // Attempts to reconnect a sphero
    this.reconnectSpheroOnMac = function reconnectSpheroOnMac(mac) {
        try {
            var port = this.orbsByMac[mac].connection.conn;
            this.orbsByMac[mac].orb.disconnect(function(err, data) {
                delete self.orbsByMac[mac];
                self.emit("sphero_disconnected", mac);
                self.connectSpheroOnPort(port);
            });
        } catch (e) {
            console.log("No sphero connected with a mac address of: " + mac + "\nAttempting a connection...");
            this.connectSpheroOnPort(this.getPort(mac));
        }
    };

    // Connects all available spheros
    this.connectAllSpheros = function connectAllSpheros() {
        var ports = this.scanBtPorts();
        for (var i = 0; i < ports.length; i++) {
            var port = ports[i];
            var mac = this.getMac(port);
            console.log(mac + " " + port);
            if (!this.orbsByMac[mac] || this.orbsByMac[mac] === {}) {
                 this.connectSpheroOnPort(port);
            } else {
                 this.reconnectSpheroOnMac(mac);
            }
        }
    };

    this.timer = setInterval(function() {
        var pingWrapper = function(orb_info) {
            try {
                orb_info.orb.ping(function(err, data) {
                    if (err) {
                        console.log("Sphero %s is not responding TTL: %d",
                                orb_info.mac,
                                    orb_info.ttl);
                        orb_info.ttl++;
                        if (orb_info.ttl > 5)
                            self.disconnectSpheroOnMac(orb_info.mac);
                    } else {
                      if (orb_info.ttl !== 0)
                        console.log("Sphero %s came online", orb_info.mac);
                    }
                });
            } catch (err) {
                console.error("ERROR: ping error with %s %s", orb_info.mac, err);
                orb_info.ttl++;
                if (orb_info.ttl > 5)
                    self.disconnectSpheroOnMac(orb_info.mac);
            }
        };


        var ports = self.scanBtPorts();
        for (var j in self.orbsByMac) {
          var found = false;
          for (var i in ports) {
            if (j === self.getMac(ports[i])) {
              found = true;
            }
          }
          if (!found) {
            console.log("Removing disconnected sphero " + j);
            self.disconnectSpheroOnMac(j);
          }
        }

        var ports = self.scanBtPorts();
        for (var i in ports) {
            var port = ports[i];
            var mac = self.getMac(port);
            if (!self.orbsByMac[mac] || self.orbsByMac[mac] === {}) {
                console.log("%s:%s not connected. Issueing connection", mac, port);
                self.connectSpheroOnPort(port);
            } else {
                pingWrapper(self.orbsByMac[mac]);
            }
        }
    }, 3000);
}

// Inherit functions from `EventEmitter`'s prototype
util.inherits(SpheroConnectController, EventEmitter);


module.exports = SpheroConnectController;
