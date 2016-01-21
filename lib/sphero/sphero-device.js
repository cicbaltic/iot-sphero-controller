'use strict';

var sphero = require('sphero');
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

		this.ping = setInterval(() => {
			// don't do anything if connect has not yet been invoked
			if (this.status === 999) return;

			if (this.connecting) {
				return;
			}

			if (this.status === 0) {
				this.logger.info('Sphero not connected. Issuing reconnect');
				this.reconnect();
				return;
			}

			this.sphero.ping((err, data) => {
				if (err) {
					this.logger.info('Sphero is not responding TTL: %d', this.ttl, err, data);
					this.ttl++;
					if (this.ttl > 5)
						this.reconnect();
				} else {
					//this.logger.info('Sphero responded to ping');
					if (this.ttl !== 0) {
						this.logger.info('Sphero came online. ttl=%d', this.ttl);
						this.ttl = 0;
					}
				}
			});
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
		})
		.on('accelerometer', (data) => {
			this.emit('accelerometer', data);
		})
		.on('collision', (data) => {
			this.emit('collision', data);
		})
		.on('odometer', (data) => {
			this.emit('odometer', data);
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
			this.emit('disconnected');
			this.sphero.disconnect(callback);
		} else {
			callback();
		}
	}

	roll(speed, direction, time) {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) reject(new Error('Not connected'));

			this.logger.info('roll:', speed, direction, time);

			this.sphero.setMotionTimeout(time || 2000);

			this.sphero.roll(speed, direction, (err, data) => {
				if (err) {
					this.logger.error('Unable to roll', err, data);
					reject(err, data);
				}

				this.emit('roll', {
					speed: speed,
					direction: direction,
					time: time
				});

				resolve(data);
			});
		});
	}

	turn(direction) {
		if (!this.isConnected()) return;
		this.logger.info('turn:', direction);
		this.sphero.setHeading(direction, (err, data) => {
			if (err) {
				this.logger.error('Unable to turn', err, data);
				return;
			}

			this.emit('turn', {
				direction: direction
			});
		});
	}

	color(rgb) {
		if (!this.isConnected()) return;
		this.logger.info('setting color', rgb);
		this.sphero.color(rgb, (err, data) => {
			if (err) {
				this.logger.error('Unable to set color', err, data);
				return;
			}

			this.emit('color', rgb);
		});
	}

	startCalibration() {
		if (!this.isConnected()) return;
		this._setStatus(3);
		this.sphero.startCalibration();
	}

	finishCalibration() {
		if (!this.isConnected()) return;
		this._setStatus(2);
		this.sphero.finishCalibration();
	}

	startCollisionDetection() {
		if (!this.isConnected()) return;
		this.sphero.detectCollisions();
	}

	streamAccelerometer(accel, sps) {
		if (!this.isConnected()) return;
		this.sphero.streamAccelerometer(sps, !accel);
	}

	stopOnDisconnect(stop) {
		if (!this.isConnected()) return;
		this.sphero.stopOnDisconnect(!stop, (err, data) => {
			if (err) {
				this.logger.error('Unable to set stop on disconnect flag', err, data);
				return;
			}
		});
	}

	streamOdometer(odor, sps) {
		if (!this.isConnected()) return;
		this.sphero.streamOdometer(sps, !odor);
	}

	sleep() {
		if (!this.isConnected()) return;
		this.logger.info('Going to sleep');
		this.sphero.sleep(0, 0, 0, (err, data) => {
			if (err) {
				this.logger.error('Unable to put sphero to sleep', err, data);
				return;
			}
			this._setStatus(0);
		});
	}

	stop() {
		if (!this.isConnected()) return;

		this.sphero.stop((err, data) => {
			if (err) {
				this.logger.error('Unable to stop sphero', err, data);
				return;
			}
		});
	}

	saveTempMacro(macro) {
		if (!this.isConnected()) return;

		this.sphero.saveTempMacro(macro, (err, data) => {
			if (err) {
				this.logger.error('Unable to save temp macro. ', macro, err, data);
				return;
			}
		});
	}

	macro(id) {
		if (!this.isConnected()) return;

		this.sphero.runMacro(id, (err, data) => {
			if (err) {
				this.logger.error('Unable to run macro. ', id, err, data);
				return;
			}
		});
	}

	setPowerNotification(flag, callback) {
		if (!this.isConnected()) return;

		this.sphero.setPowerNotification(flag, (err, data) => {
			this.emit('power', data);
			if (callback) callback(err, data);
		});
	}

	setBackLed(brightness, callback) {
		if (!this.isConnected()) return;

		this.sphero.setBackLed(brightness, (err, data) => {
			if (err) {
				this.logger.error('Unable to set backled brightness', err);
			}
			if (callback) callback(err, data);
		});
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
