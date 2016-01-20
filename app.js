'use strict';

/*eslint no-console: 0*/

var YAML = require('yamljs');
var _ = require('underscore');
var Iot = require('./lib/iot');
var Sphero = require('./lib/sphero');
var Behaviour = require('./lib/behaviour');

var bunyan = require('bunyan');

const cluster = require('cluster');

function fork(workers, sphero_config) {
	var w = cluster.fork({
		'config': JSON.stringify(sphero_config)
	});
	workers[w.process.pid] = sphero_config;
}

if (cluster.isMaster) {
	this.logger = bunyan.createLogger({
		name: 'main'
	});
	var argv = require('minimist')(process.argv.slice(2));

	if (argv.help) {
		console.log('Sphero controller app connected to IBM IoT Foundation.');
		console.log('Options:');
		console.log('--config {file} - configuration YAML file. The format is as follows:');
		console.log('--behaviour {variant} - override the behaviour variant in all spheros');
		console.log('--sphero {variant} - override the sphero variant in all spheros');
		console.log('--iot {variant} - override the iot variant in all spheros');
		console.log('--org {org} - override the iot organization in all spheros');
		console.log('--type {type} - override the iot device type in all spheros');
		console.log('spheros:');
		console.log('  - name: friendly device name');
		console.log('    mac: device mac address, i.e. 68:86:E7:04:98:35');
		console.log('    variant: device type to use: sphero - for real sphero device, sim - for simulated');
		console.log('    behaviour: devices behaviour strategy to use: none - for real sphero device, conway - Conways game of life');
		console.log('    iot:');
		console.log('      variant: device type to use: iot - for real iot connectivity, log - for logging only, sim - for simulation');
		console.log('      org: IoT Foundation organization id');
		console.log('      type: Device type');
		console.log('      id: Device Id');
		console.log('      auth-method: authorization method/password, use \'token\' for IoT Foundation');
		console.log('      auth-token: device authorization token');
		process.exit(1);
	}

	if (!argv.config) {
		console.error('Please provide the config file with --config option.');
		process.exit(1);
	}

	var config = YAML.load(argv.config);

	// replace config values with command line overrides
	_.each(config.spheros, (sphero_config) => {
		sphero_config.variant = argv.sphero || sphero_config.variant;
		sphero_config.behaviour = argv.behaviour || sphero_config.behaviour;
		sphero_config.iot.variant = argv.iot || sphero_config.iot.variant;
		sphero_config.iot.org = argv.org || sphero_config.iot.org;
		sphero_config.iot.type = argv.type || sphero_config.iot.type;
	});

	this.logger.info('Config: ', config);

	var workers = {};

	// Fork workers.
	_.each(config.spheros, (sphero_config) => {
		fork(workers, sphero_config);
	});

	cluster.on('exit', (worker, code, signal) => {
		this.logger.error(`worker ${worker.process.pid} ${signal || code} died`);
		fork(workers, workers[worker.process.pid]);
	});
} else {
	config = JSON.parse(process.env.config);
	var logger = bunyan.createLogger({
		name: `worker-${config.name}`
	});

	logger.info('Config: ', config);
	var spheroDevice = Sphero(config);
	var iotDevice = Iot(config.name, config.iot);
	var behaviour = Behaviour(spheroDevice, config);

	// Handle events from sphero
	spheroDevice
		.on('connected', () => {
			behaviour.start();
			spheroDevice.setPowerNotification(true);
			spheroDevice.setBackLed(127);
			spheroDevice.startCollisionDetection();
			spheroDevice.stopOnDisconnect(true);
		})
		.on('disconnected', () => {
			behaviour.end();
		})
		.on('power', (data) => {
			logger.info('Power data:', data);
		})
		.on('accelerometer', (data) => {
			iotDevice.publish('accelerometer', data);
		})
		.on('collision', (data) => {
			iotDevice.publish('collision', data);
		})
		.on('accelerometer', (data) => {
			iotDevice.publish('accelerometer', data);
		})
		.on('odometer', (data) => {
			iotDevice.publish('odometer', data);
		})
		.on('roll', (data) => {
			iotDevice.publish('roll', data);
		})
		.on('turn', (data) => {
			iotDevice.publish('turn', data);
		})
		.on('status_changed', () => {
			iotDevice.publish('status', {
				status: spheroDevice.getStatus()
			});
		})
		.on('color', (color) => {
			iotDevice.publish('color', color);
		});

	// handle commands from IoT
	iotDevice
		.on('connected', () => {
			iotDevice.publish('status', {
				'status': spheroDevice.getStatus()
			});
		})
		.on('roll', (device, payload) => {
			spheroDevice.roll(payload.speed, payload.direction, payload.time);
		})
		.on('turn', (device, payload) => {
			spheroDevice.turn(payload.direction);
		})
		.on('calibrate_start', () => {
			spheroDevice.startCalibration();
			iotDevice.publish('calibrating', {});
			setTimeout(function() {
				spheroDevice.finishCalibration();
				iotDevice.publish('status', {
					status: 'ready'
				});
			}, 5000);
		})
		.on('calibrate_end', () => {
			spheroDevice.finishCalibration();
		})
		.on('status', () => {
			iotDevice.publish('status', {
				'status': spheroDevice.getStatus()
			});
		})
		.on('color', (device, payload) => {
			spheroDevice.color(payload);
		})
		.on('sleep', () => {
			spheroDevice.sleep();
		})
		.on('stop', () => {
			spheroDevice.stop();
		})
		.on('config', (device, data) => {
			if (data.accel) {
				spheroDevice.streamAccelerometer(data.accel.stream, data.accel.sps);
			}
			if (data.odor) {
				spheroDevice.streamOdometer(data.odor.stream, data.odor.sps);
			}
			if (data.collision) {
				spheroDevice.streamOdometer(data.odor.stream, data.odor.sps);
			}
		})
		.on('macro', (device, data) => {
			spheroDevice.macro(data);
		});

	spheroDevice.connect();
	iotDevice.connect();
}
