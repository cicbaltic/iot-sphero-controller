'use strict';

var bunyan = require('bunyan');
var EventEmitter = require('events').EventEmitter;

class SpheroSimDevice extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.STATE_MAP = {
      999: 'disconnected',
      0: 'disconnected',
      1: 'connecting',
      2: 'ready',
      3: 'calibrating'
    };
    this.logger = bunyan.createLogger({
      name: `sphero-sim-${config.name}`
    });
    this.status = 999;
    this.connecting = false;
    this.odor = {x : 0, y : 0};
  }

  name() {
    return this.config.name;
  }

  connect() {
    this.connecting = true;
    this._setStatus(2);
    this.logger.info('Sphero SIM connected');
    this.emit('connected', {
      test: "connected"
    });
  }

  reconnect() {
    this.disconnect(() => {
      this.ttl = 0;
      this._setStatus(0);
      this.connect();
    });
  }

  disconnect(callback) {
    if (this.status != 0) {
      this.ttl = 0;
      this._setStatus(0);
      callback();
    } else {
      callback();
    }
  }

  roll(speed, direction, time) {
    this.logger.info('Roll SIM connected');
    if (!this.isConnected()) return;

    this.odor.x += this._rand(10);
    this.odor.y += this._rand(10);

    this.emit("roll", {
      speed: speed,
      direction: direction,
      time: time
    });
  }

  color(rgb) {
    if (!this.isConnected()) return;
    this.emit('color', rgb);
  };

  startCalibration() {
    if (!this.isConnected()) return;
    this._setStatus(3);
  };

  finishCalibration() {
    if (!this.isConnected()) return;
    this._setStatus(2);
  };

  _rand(range) {
    return Math.floor(Math.random() * range);
  }

  startCollisionDetection() {
    if (!this.isConnected()) return;
    setInterval(() => {
      if (this._rand(100) < 60) {
        this.emit('collision', {
          desc: 'Collision detected',
          idCode: 7,
          event: 'collision',
          did: 2,
          cid: 18,
          packet: {
            sop1: 255,
            sop2: 254,
            idCode: 7,
            dlenMsb: 0,
            dlenLsb: 17,
            dlen: 17,
            data: new Buffer(""),
            checksum: 210
          },
          x: this._rand(65535),
          y: this._rand(65535),
          z: this._rand(10),
          axis: 1,
          xMagnitude: this._rand(100),
          yMagnitude: this._rand(100),
          speed: 0,
          timestamp: 98565
        });
      }
    }, 2000);
  };

  streamAccelerometer(sps) {
    if (!this.isConnected()) return;
    setInterval(() => {
      this.emit('accelerometer', {
        xAccel: {
          sensor: 'accelerometer axis X, filtered',
          range: {
            bottom: -32768,
            top: 32767
          },
          units: '1/4096 G',
          value: [this._rand(4096)]
        },
        yAccel: {
          sensor: 'accelerometer axis Y, filtered',
          range: {
            bottom: -32768,
            top: 32767
          },
          units: '1/4096 G',
          value: [this._rand(4096)]
        },
        zAccel: {
          sensor: 'accelerometer axis Z, filtered',
          range: {
            bottom: -32768,
            top: 32767
          },
          units: '1/4096 G',
          value: [this._rand(4096)]
        }
      });
    }, Math.floor(1000 * sps));
  }

  stopOnDisconnect(stop) {}

  streamOdometer(sps) {
    if (!this.isConnected()) return;
    setInterval(() => {
      this.emit('odometer', {
        Odometer:
               { sensor: 'odomoter X',
                 range: { bottom: -32768, top: 32767 },
                 units: 'cm',
                 value: [ this.odor.x ] },
              yOdometer:
               { sensor: 'odomoter Y',
                 range: { bottom: -32768, top: 32767 },
                 units: 'cm',
                 value: [ this.odor.y ] }
      });
    }, Math.floor(1000 * sps));
  }

  sleep() {
    if (!this.isConnected()) return;
    this.logger.info('Going to sleep');
  }

  stop() {}

  macro(id) {}

  getStatus() {
    return this.STATE_MAP[this.status];
  }

  _setStatus(status) {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.emit('status_changed', this.getStatus());
  }

  isConnected() {
    return this.status === 2;
  }
}

module.exports = SpheroSimDevice;
