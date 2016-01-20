'use strict';

var bunyan = require('bunyan');

class Conway {
	constructor(sphero) {
		this.sphero = sphero;
		this.logger = bunyan.createLogger({
			name: `behaviour-conway-${sphero.name()}`
		});
	}

	// tells each Sphero what to do
	start() {
		this.contacts = 0,
			this.age = 0,
			this.alive = false;
		this.death_waits = 0;

		this.born();

		this.sphero.on('collision', () => {
			this.contacts += 1;
			this.logger.info(`Hi, my name is ${this.sphero.name()}. I am ${this.age} and have now ${this.contacts} contacts.`);
			this.stop();
		});

		this.moveInt = setInterval(() => {
			if (this.alive) {
				this.color({
					r: this._rand(255),
					g: this._rand(255),
					b: this._rand(255)
				});
				this.move();
			}
		}, 3000);

		this.lifeInt = setInterval(this.birthday.bind(this), 10000);
	}

	end() {
		clearInterval(this.moveInt);
		clearInterval(this.lifeInt);
	}

	_rand(range) {
		return Math.floor(Math.random() * range);
	}

	// roll Sphero in a random direction
	move() {
		this.sphero.roll(60, this._rand(360));
	}

	// stop Sphero
	stop() {
		this.sphero.stop();
	}

	// set Sphero's color
	color(color) {
		this.sphero.color(color);
	}

	born() {
		this.contacts = 0;
		this.age = 0;
		this.life();
		this.move();
	}

	life() {
		this.alive = true;
		this.color({
			r: 0,
			g: 255,
			b: 0
		});
	}

	death() {
		this.alive = false;
		this.color({
			r: 255,
			g: 0,
			b: 0
		});
		this.stop();
		this.logger.info(`Congratulations ${this.sphero.name()} you are now dead`);
		this.death_waits += 1;
		if (this.death_waits <= 100) {
			this.logger.info(`Ok, ${this.sphero.name()}, allowing you to reincarnate.`);
			this.death_waits = 0;
			this.born();
		}
	}

	enoughContacts() {
		return this.contacts >= 2 && this.contacts < 7;
	}

	birthday() {
		this.age += 1;

		if (this.alive) {
			this.logger.info('Happy birthday ', this.sphero.name());
			this.logger.info(`You are ${this.age} and had ${this.contacts} contacts.`);
		}

		if (this.enoughContacts()) {
			if (!this.alive) {
				this.born();
			}
		} else {
			this.death();
		}
	}
}

module.exports = Conway;
