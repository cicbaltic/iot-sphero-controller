'use strict';

var bunyan = require('bunyan');
var EventEmitter = require('events').EventEmitter;

class IotLogDevice extends EventEmitter {

  constructor(name, config) {
    super();
    this.logger = bunyan.createLogger({name: `iot-log-${name}-${config.id}`});
    this.config = config;
  }

  connect() {
    this.logger.info('Connected to IOT Foundation', this.config.id);
    this.emit('connected');
  }

  publish(event, data) {
    this.logger.info(`Published event ${event}`, data);
  }
}

module.exports = IotLogDevice;
