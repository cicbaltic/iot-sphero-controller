var sphero = require("sphero");
var fs = require("fs");

// scan for connected bluetooth devices
var btConnections = [];
var rfcomms = fs.readdirSync("/dev");
for(var i = 0; i <= rfcomms.length; i++) {
    var rfcomm = String(rfcomms[i]);
    if (rfcomm.substring(0, 6) == "rfcomm") {
        btConnections.push(rfcomm);
    }
};
console.log("Active Bt conns: " + btConnections);


// instantiate sphero objects
var orbs = [];
for (var i = 0; i < btConnections.length; i++) {
    orbs.push(sphero("/dev/" + btConnections[i]));
}

// connect to activeSpheros
for (var i = 0; i < orbs.length; i++) {
    connectOrb(orbs[i]);
}

function connectOrb(orb) {
    orb.connect(function(err, data) {
    getOrbMac(orb);
    })
};

// get sphero MAC and assign it to orb object
function getOrbMac(orb) {
    var btData;
    orb.getBluetoothInfo(function(err, data) {
        var mac = "";
        try {
            btData = data.data;
            for (var i = 16; i < 28; i++) {
                mac += String.fromCharCode(btData[i]).toUpperCase();
            }
            orb["macAddress"] = mac;
            console.log("connected to an orb on: " + orb.connection.conn + ", by the mac of: " + orb['macAddress']);
        } catch (e) {
            console.log("connection to " + orb.connection.conn + " failed");
        } finally {
            exports.orbs = orbs;
        }
    });
};
