# Running Sphero with the IoT

This project contains both the possibility to control the actual Sphero device as well as have a code simulations of a Sphero and report and be controlled by the IBM IoT Foundation.

## Configuration
The configuration is done via YAML file and passed to the application via --config command line argument.
The format is as follows:
`spheros:
    - name: friendly device name
    mac: device mac address, i.e. 68:86:E7:04:98:35
    variant: device type to use: sphero - for real sphero device, sim - for simulated
    behaviour: devices behaviour strategy to use: none - for real sphero device, conway - Conways game of life
    iot:
      variant: device type to use: iot - for real iot connectivity, log - for logging only
      org: IoT Foundation organization id
      type: Device type
      id: Device Id
      auth-method: authorization method/password, use "token" for IoT Foundation
      auth-token: device authorization token`

The section starting with name should be repeated for each instance of Sphero connected.

### Sphero devices
Sphero devices can be real devices by using 'sphero' variant, or virtual simulated by using 'sim' option, which is good for testing and playing around with the code.

### Iot connection
Iot connections can be actual 'iot' variant, or just log the events coming out by using 'log' variant.

### Behaviour
The Spheros can have a behaviour assigned that will drive the Sphero: 'none' - does no control of the Sphero and allows the full control via IoT Foundation, 'conway' - plays as Conway's game of life with the Sphero.

## Configuring IoT Foundation
Create an IoT foundation service in IBM Bluemix. In the IoT Foundation dashboard create a device type (i.e. sphero) and create a devices for each Sphero instance you want to connect (please not deviceId and the auth token) and provide them in the configuration file.

## Virtual Sphero setup in a Docker container
Virtual Sphero is setup by using using a [config-sim.yml] file and can be run in either on the host with `npm start` or in a Docker container.

### Building Docker container
To build Docker container run `docker build --rm -t noxxious/iot-sphero-controller:1.0 .`.
After the build is complete the container can be run with `docker run -it --rm --name iot-sphero-controller noxxious/iot-sphero-controller:1.0`.

## Actual Sphero setup
If you have the actual Sphero device then you can run them either in your machine given you have a Bluetooth adapter or run in a Vagrant and Ansible provisioned virtual machine that will use host machine Bluetooth adapter.
For this Sphero devices configuration requires a variant of 'sphero' and a MAC address.
Vagrant provisions the machine, but does not start the application by default, it can be started with the following command `vagrant ssh -c "node /vagrant/app.js --config=/vagrant/config.yml|/vagrant/node_modules/.bin/bunyan"`
