"use strict";

var util = require("util"),
    EventEmitter = require("events").EventEmitter;

var serialport,
    isChrome = typeof chrome !== "undefined";

try {
  serialport = require("bluetooth-serial-port");
} catch (error) {
  console.error(error);
  serialport = null;
}

if (serialport == null) {
  var err = [
    "It looks like bluetooth-serial-port didn't compile properly.",
    "This is a common problem, and it's fix is documented here:",
    "https://github.com/eelcocramer/node-bluetooth-serial-port"
  ].join(" ");

  console.error(err);
  throw new Error("Missing bluetooth-serial-port dependency");
}

/**
 * An adaptor to communicate with a serial port
 *
 * @constructor
 * @param {String} conn the serialport string to connect to
 */
var Adaptor = module.exports = function Adaptor(conn) {
  this.conn = conn;
  this.serialport = null;
};

util.inherits(Adaptor, EventEmitter);

/**
 * Opens a connection to the serial port.
 * Triggers the provided callback when ready.
 *
 * @param {Function} callback (err)
 * @return {void}
 */
Adaptor.prototype.open = function open(callback) {
  var self = this,
      port = this.serialport = new serialport.BluetoothSerialPort();
  port.findSerialPortChannel(self.conn, function(channel) {
    console.log("Opening: " + self.conn + " on channel: " + channel);
    port.connect(self.conn, channel, function(err){
      if (err) {
        callback(err);
        return
      }

      self.emit("open");
      port.on("error", emit("error"));
      port.on("close", emit("close"));
      port.on("data", emit("data"));
      callback();

    });
  }, function(err) {
      err = err || "Not found";
      callback(err);
  });

  function emit(name) {
    return self.emit.bind(self, name);
  }
};

/**
 * Writes data to the serialport.
 * Triggers the provided callback when done.
 *
 * @param {Any} data info to be written to the serialport. turned into a buffer.
 * @param {Function} [callback] triggered when write is complete
 * @return {void}
 */
Adaptor.prototype.write = function write(data, callback) {
  if (!callback) {
    callback = function (err, bytesWritten) {
      if (err) console.log(err);
    }
  }
  this.serialport.write(new Buffer(data, 'utf-8'), callback);
};

/**
 * Adds a listener to the serialport's "data" event.
 * The provided callback will be triggered whenever the serialport reads data
 *
 * @param {Function} callback function to be invoked when data is read
 * @return {void}
 */
Adaptor.prototype.onRead = function onRead(callback) {
  this.on("data", callback);
};

/**
 * Disconnects from the serialport
 * The provided callback will be triggered after disconnecting
 *
 * @param {Function} callback function to be invoked when disconnected
 * @return {void}
 */
Adaptor.prototype.close = function close(callback) {
  this.serialport.close(callback);
};
