var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var cmd = "gort scan bluetooth | grep Sphero";
var spheros = [];
var orboM;

//
// var test = spawn('ls');
//
// test.stdout.on('data', function(data) {
//     console.log(String(data));
// });
// test.stderr.on('data', function(data) {
//     console.log(String(data));
// });
// test.on('error', function(error) {
//     console.log(error);
// });
// test.on('exit', function() {
//     console.log("bye");
// })

// exec(cmd, function(error, stdout, stderr) {
//     //console.log(stdout.split('\t'));
//     spheros.push(stdout.split('\t')[1]);
//     spheros.push(stdout.split('\t')[3]);
//     console.log(spheros);
    singularConnect(spheros[0]);
//     //singularConnect(spheros[1]);
// });

function singularConnect(mac) {
    console.log("attempting to execute command");
    exec("bluez-test-serial -i hci0 68:86:E7:04:DC:7E", function(error, stdout, stderr) {
        console.log('deita:\n' + String(stdout));
        console.log('stderro:\n' + String(stderr));
        console.log('error:\n' + String(error));
    })
}

// function singularConnect(mac) {
//     var orbo = spawn("gort", ["bluetooth", "connect", mac]);
//     orboM = orbo;
//     orbo.stdout.on('data', function(data) {
//         console.log('deita:\n' + String(data));
//     });
//     orbo.stderr.on('data', function(data) {
//         console.log('stedera:\n' + String(data));
//     });
//     orbo.on('data', function(data) {
//         console.log("belekas:\n" + String(data));
//     });
// }
