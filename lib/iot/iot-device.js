'use strict';

var bunyan = require('bunyan');
var EventEmitter = require('events').EventEmitter;
var IotfDevice  = require('ibmiotf').IotfDevice;

class IotDevice extends EventEmitter {

  constructor(name, config) {
    super();
    this.logger = bunyan.createLogger({name: `iot-${name}-${config.id}`});
    this.config = config;
    this.device = new IotfDevice(config);
  }

  connect() {
    this.device.connect();

    this.device
    .on("connect", (err, data) => {
      this.logger.info('Connected to IOT Foundation', this.config.id);
      this.emit('connected', this.config.device, data);
    })
    .on("command", (command, format, payload, topic) => {
      this.logger.info(`Command received`, command, format, topic, payload);
      this.emit(command, this.config.device, JSON.parse(payload));
    });
  }

  publish(event, data) {
    if (!this.device.isConnected) {
      this.logger.error('Device is not connected to IoT Foundation');
      return;
    }

    this.logger.info(`Published event ${event}`);
    this.device.publish(event, 'json', JSON.stringify(data));
  }
}

module.exports = IotDevice;
