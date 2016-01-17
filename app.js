'use strict';

var YAML = require('yamljs');
var _ = require('underscore');
var Iot = require('./lib/iot');
var Sphero = require('./lib/sphero');
var Behaviour = require('./lib/behaviour');

var bunyan = require('bunyan');

const cluster = require('cluster');

if (cluster.isMaster) {
  this.logger = bunyan.createLogger({
    name: 'main'
  });
  var argv = require('minimist')(process.argv.slice(2));

  if (argv.help) {
    console.log('Sphero controller app connected to IBM IoT Foundation.');
    console.log('Options:');
    console.log('--config {file} - configuration YAML file. The format is as follows:');
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
    console.log('      auth-method: authorization method/password, use "token" for IoT Foundation');
    console.log('      auth-token: device authorization token');
    process.exit(1);
  }

  if (!argv.config) {
    console.error('Please provide the config file with --config option.');
    process.exit(1);
  }

  var config = YAML.load(argv.config);
  this.logger.info('Config: ', config);

  var workers = {};

  function fork(sphero_config) {
    var w = cluster.fork({
      'config': JSON.stringify(sphero_config)
    });
    workers[w.process.pid] = sphero_config;
  };

  // Fork workers.
  _.each(config.spheros, (sphero_config, key) => {
    fork(sphero_config);
  });

  cluster.on('exit', (worker, code, signal) => {
    this.logger.error(`worker ${worker.process.pid} ${signal || code} died`);
    fork(workers[worker.process.pid]);
  });
} else {
  var config = JSON.parse(process.env.config);
  var logger = bunyan.createLogger({
    name: `worker-${config.name}`
  });

  logger.info('Config: ', config);
  var spheroDevice = Sphero(config);
  var iotDevice = Iot(config.name, config.iot);
  var behaviour = Behaviour(spheroDevice, config);

  // Handle events from sphero
  spheroDevice
    .on("connected", () => {
      behaviour.start();
      spheroDevice.streamAccelerometer(1);
      spheroDevice.startCollisionDetection();
      spheroDevice.stopOnDisconnect(true);
      spheroDevice.streamOdometer(1);
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
    .on('status_changed', (status) => {
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
    .on('roll', (payload) => {
      spheroDevice.roll(payload.speed, payload.direction, payload.time);
    })
    .on('calibrate_start', () => {
      spheroDevice.startCalibration();
      iotDevice.publish("calibrating", {});
      setTimeout(function() {
        spheroDevice.finishCalibration();
        iotDevice.publish('status', {
          status: 'ready'
        });
      }, 5000);
    })
    .on('calibrate_end', (payload) => {
      spheroDevice.finishCalibration();
    })
    .on('status', (device, payload) => {
      iotDevice.publish('status', {
        'status': spheroDevice.getStatus()
      });
    })
    .on('set_color', (device, payload) => {
      spheroDevice.color(payload);
    })
    .on('sleep', () => {
      spheroDevice.sleep();
    })
    .on('stop', () => {
      spheroDevice.stop();
    })
    .on('macro', (data) => {
      spheroDevice.macro(data);
    });

  spheroDevice.connect();
  iotDevice.connect();
}
