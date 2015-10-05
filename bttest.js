var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

connect("68:86:E7:04:98:35");
connect("68:86:E7:04:DC:7E");

function connect(address) {
    var bt = new (require('bluetooth-serial-port')).BluetoothSerialPort();
    bt.findSerialPortChannel(address, function(channel) {
        console.log('Found serial port channel %s %s', address, channel);

        bt.connect(address, channel, function() {
            console.log('connected %s', address);

            /*btSerial.write(new Buffer('my data', 'utf-8'), function(err, bytesWritten) {
                if (err) console.log(err);
            });*/

            /*btSerial.on('data', function(buffer) {
                console.log(buffer.toString('utf-8'));
            });*/

            setTimeout(function(){bt.close();}, 600000
            );
            // close the connection when you're ready
            bt.close();
        }, function (error) {
            console.log('cannot connect %s', address);
            console.log(error);
        });
    }, function() {
        console.log('found nothing %s', address);
    });

    bt.on("closed", function() {
        console.log('Closed connection to %s', address);
    });
}
