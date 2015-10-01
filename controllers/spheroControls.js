var spheroConnect = require("./connect");
var sphero = require("sphero");

var macOrb = spheroConnect.connectAllSpheros();

var rollInterval;

// function rollForTime(mac, speed, direction, time) {
//     var orb = macOrb[mac];
//     var rollInterval;
//     rollForTimeInner(orb, speed, direction, time);
// }


function rollForTime(mac, speed, direction, time) {
    try {
        macOrb[mac].roll(speed, direction);
    } catch (e) {
        console.log("Error trying to move an orb, ");
        console.log(e);
        spheroConnect.reconnectSpheroOnMac(mac);
    }
}

function calibrate(mac) {
    var orb = macOrb[mac];
    try {
        orb.startCalibration();
        setTimeout(function() {
            orb.finishCalibration();
        }, 5000);
    } catch (e) {
        console.log("Error trying to calibrate an orb, ");
        console.log(e);
        spheroConnect.reconnectSpheroOnMac(mac);
    }
}

function rollForTimeInner(orb, speed, direction, time) {
    try {
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
    } catch (e) {
        console.log("uh oh, we're in trouble");
        console.log(String(e));
    }
};

module.exports = {
    rollForTime: rollForTime,
    calibrate: calibrate,
    macOrb: macOrb
}
