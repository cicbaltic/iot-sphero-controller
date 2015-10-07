"use strict";
/*jshint node:true*/

var sphero = require("sphero");
var util = require("util");
//var buffer = require('buffer');

var EventEmitter = require("events").EventEmitter;

// function rollForTime(mac, speed, direction, time) {
//     var orb = macOrb[mac];
//     var rollInterval;
//     rollForTimeInner(orb, speed, direction, time);
// }

function SpheroController() {
    var self = this;

    this.rollInterval = undefined;

    EventEmitter.call(this);

    this.setColor = function setColor(orb, rgb) {
        console.log("attempt color change");
        orb.color(rgb, function() {
            console.log("Colors set to: " + JSON.stringify(rgb));
        });
    };

    this.rollForTime = function rollForTime(orb, speed, direction, time) {
        try {
            orb.roll(speed, direction);
            self.emit("rolled", orb);
        } catch (e) {
            console.log("Error trying to move an orb, ");
            console.log(e);
            //spheroConnect.reconnectSpheroOnMac(mac);
        }
    };

    this.calibrateBegin = function calibrateBegin(orb) {
        try {
            orb.startCalibration();
        } catch (e) {
            console.log("Error trying to start calibration: ");
            console.log(e);
        }
    };

    this.calibrateEnd = function calibrateEnd(orb) {
        try {
            orb.finishCalibration();
        } catch (e) {
            console.log("Error trying to finish calibration: ");
            console.log(e);
        }
    };

    this.rollForTimeInner = function rollForTimeInner(orb, speed, direction, time) {
        try {
            if (self.rollInterval) {
                clearInterval(self.rollInterval);
                orb.roll(0, direction);
            }
            if (time > 1000) {
                self.rollInterval = setInterval(function() {
                    orb.roll(speed, direction);
                }, 500);
                setTimeout(function() {
                    clearInterval(self.rollInterval);
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

    this.startCollisionDetection = function startCollisionDetection(orb, mac) {
        orb.detectCollisions();
        orb.on("collision", function(data) {
            self.emit("collision", data, mac);
        });
    };

}

util.inherits(SpheroController, EventEmitter);

module.exports = SpheroController;
