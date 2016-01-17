'use strict';

module.exports = function (name, config) {
  var devices = {
    'iot': require('./iot-device'),
    'log': require('./iot-log'),
    //'sim': require('./iot-sim')
  };

  var variant = devices[config.variant];

  if (!variant) {
    console.error(`Iot variant ${config.variant} is not supported.`);
    process.exit(-1);
  }
  return new variant(name, config);
};
