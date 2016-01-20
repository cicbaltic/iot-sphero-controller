'use strict';

var bunyan = require('bunyan');

class Circle {
	constructor(sphero) {
		this.sphero = sphero;
		this.logger = bunyan.createLogger({
			name: `behaviour-circle-${sphero.name()}`
		});

		this.sphero.on('collision', () => {
			this.contacts += 1;
			this.logger.info(`Hi, my name is ${this.sphero.name()}. I have now ${this.contacts} contacts.`);
		});

		this.sphero.on('roll', data => {
			data.direction += 40;
			if (data.direction > 360) data.direction = 0;

			if (!this.connected) return;
			
			process.nextTick(() => {
				this.sphero.roll(data.speed, data.direction)
					.catch(() => {

					});
			});
		});
	}

	// tells each Sphero what to do
	start() {
		this.contacts = 0;
		this.connected = true;

		this.colorInt = setInterval(() => {
			this.color({
				r: this._rand(255),
				g: this._rand(255),
				b: this._rand(255)
			});
		}, 3000);

		this.sphero.roll(100, 0);
	}

	end() {
		clearInterval(this.colorInt);
		this.connected = false;
	}

	_rand(range) {
		return Math.floor(Math.random() * range);
	}

	// turn Sphero in a circle
	turn() {
		this.direction += 40;
		if (this.direction > 360) this.direction = 0;

		return this.direction;
	}

	// roll Sphero in a random direction
	move() {
		this.sphero.roll(100, this.turn());
	}

	// stop Sphero
	stop() {
		this.sphero.stop();
	}

	// set Sphero's color
	color(color) {
		this.sphero.color(color);
	}
}

module.exports = Circle;
