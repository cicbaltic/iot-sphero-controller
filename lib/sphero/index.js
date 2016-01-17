'use strict';

module.exports = function (config) {
  var devices = {
    'sphero': require('./sphero-device'),
    'sim': require('./sphero-sim')
  };

  var variant = devices[config.variant];

  if (!variant) {
    console.error(`Sphero variant ${config.variant} is not supported.`);
    process.exit(-1);
  }
  return new variant(config);
};
