'use strict';

module.exports = function (sphero, config) {
  var behaviours = {
    'none': require('./default'),
    'conway': require('./conway'),
    //'macro': require('./macro')
  };

  var variant = behaviours[config.behaviour];

  if (!variant) {
    console.error(`Behaviour ${config.behaviour} is not supported.`);
    process.exit(-1);
  }
  return new variant(sphero, config);
};
