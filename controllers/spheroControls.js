var sphero = require("sphero");
var rollInterval;

// function rollForTime(mac, speed, direction, time) {
//     var orb = macOrb[mac];
//     var rollInterval;
//     rollForTimeInner(orb, speed, direction, time);
// }

function setColor(orb, rgb) {
    console.log("attempt color change");
    orb.color(rgb, function() {
        console.log("Colors set to: " + JSON.stringify(rgb));
    });
}

function rollForTime(orb, speed, direction, time) {
    try {
        orb.roll(speed, direction);
    } catch (e) {
        console.log("Error trying to move an orb, ");
        console.log(e);
        spheroConnect.reconnectSpheroOnMac(mac);
    }
}

function calibrateBegin(orb) {
    try {
        orb.startCalibration();
    } catch (e) {
        console.log("Error trying to start calibration: ");
        console.log(e);
    }
}

function calibrateEnd(orb) {
    try {
        orb.finishCalibration();
    } catch (e) {
        console.log("Error trying to finish calibration: ");
        console.log(e);
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
    calibrateBegin: calibrateBegin,
    calibrateEnd: calibrateEnd,
    setColor: setColor
}
