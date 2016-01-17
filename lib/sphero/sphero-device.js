'use strict';

var sphero = require("sphero");
var bunyan = require('bunyan');
var EventEmitter = require('events').EventEmitter;
var BTAdaptor = require('../adaptors/bluetooth-serialport');

class SpheroDevice extends EventEmitter {
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
      name: `sphero-${config.name}`
    });
    this.status = 999;
    this.ttl = 0;
    this.connecting = false;

    this.timer = setInterval(() => {
      if (this.connecting) {
        return;
      }

      if (this.status === 0) {
        this.logger.info('Sphero not connected. Issuing reconnect');
        this.reconnect();
        return;
      }

      try {
        this.sphero.ping((err, data) => {
          if (err) {
            this.logger.info("Sphero is not responding TTL: %d", this.ttl, err, data);
            this.ttl++;
            if (this.ttl > 5)
              this.reconnect();
          } else {
            //this.logger.info('Sphero responded to ping');
            if (this.ttl !== 0) {
              this.logger.info("Sphero came online. ttl=%d", this.ttl);
              this.ttl = 0;
            }
          }
        });
      } catch (err) {
        this.logger.error("ERROR: ping error with %s", err);
        this.ttl++;
        if (this.ttl > 5)
          this.reconnect();
      }
    }, 5000);
  }

  name() {
    return this.config.name;
  }

  connect() {
    this.logger.info(`Connect started to mac ${this.config.mac}`);
    this.connecting = true;
    this.sphero = sphero(null, {
      adaptor: new BTAdaptor(this.config.mac),
      emitPacketErrors: true
    });
    this.sphero.connect((err) => {
      if (err) {
        this.logger.error('Error connecting to sphero', err);
        this._setStatus(0);
        this.connecting = false;
        return;
      }

      this._setStatus(2);
      this.connecting = false;
      this.logger.info('Sphero connected');
      this.emit('connected');

      this.sphero.on('error', (err, data) => {
        this.logger.error('Error communicating to sphero', err, data);
      });
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
      this.sphero.disconnect(callback);
    } else {
      callback();
    }
  }

  roll(speed, direction, time) {
    if (!this.isConnected()) return;
    this.logger.info('roll:', speed, direction, time);
    this.sphero.roll(speed, direction);
    this.sphero.setMotionTimeout(time);
    this.emit("roll", {
      speed: speed,
      direction: direction,
      time: time
    });
  }

  color(rgb) {
    if (!this.isConnected()) return;
    this.logger.info('setting color', rgb);
    this.sphero.color(rgb, () => {
      this.logger.info('colors set', rgb);
      this.emit('color', rgb);
    });
  };

  startCalibration() {
    if (!this.isConnected()) return;
    this._setStatus(3);
    this.sphero.startCalibration();
  };

  finishCalibration() {
    if (!this.isConnected()) return;
    this._setStatus(2);
    this.sphero.finishCalibration();
  };

  startCollisionDetection() {
    if (!this.isConnected()) return;
    this.sphero.detectCollisions();
    this.sphero.on("collision", (data) => {
      this.emit("collision", data);
    });
  };

  streamAccelerometer(sps) {
    if (!this.isConnected()) return;
    this.sphero.streamAccelerometer(sps);
    this.sphero.on("accelerometer", (data) => {
      this.emit("accelerometer", data);
    });
  }

  stopOnDisconnect(stop) {
    if (!this.isConnected()) return;
    this.sphero.stopOnDisconnect(!stop, (err, data) => {
      if (err) {
        this.logger.error('Unable to set stop on disconnect flag', err);
        return;
      }
    });
  }

  streamOdometer(sps) {
    if (!this.isConnected()) return;
    this.sphero.streamOdometer(sps);
    this.sphero.on("odometer", (data) => {
      this.emit("odometer", data);
    });
  }

  sleep() {
    if (!this.isConnected()) return;
    this.logger.info('Going to sleep');
    this.sphero.sleep(0, 0, 0, (err, data) => {
      if (err) {
        this.logger.error('Unable to put sphero to sleep', err);
        return;
      }
      this.setStatus(0);
    });
  }

  stop() {
    if (!this.isConnected()) return;

    this.sphero.stop((err, data) => {
      if (err) {
        this.logger.error('Unable to stop sphero', err);
        return;
      }
    })
  }

  saveTempMacro(macro) {
    if (!this.isConnected()) return;

    this.sphero.saveTempMacro(macro, (err, data) => {
      if (err) {
        this.logger.error('Unable to save temp macro. ', macro, err);
        return;
      }
    })
  }

  macro(id) {
    if (!this.isConnected()) return;

    this.sphero.runMacro(id, (err, data) => {
      if (err) {
        this.logger.error('Unable to run macro. ', id, err);
        return;
      }
    })
  }

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

module.exports = SpheroDevice;
