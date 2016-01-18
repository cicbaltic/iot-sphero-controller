FROM node:4.1
MAINTAINER Gytis Raciukaitis<gytis.raciukaitis@lt.ibm.com>

RUN apt-get update && apt-get install -y build-essential libbluetooth-dev
# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm cache clean
RUN npm install -d --production

ENTRYPOINT [ "npm", "start" ]
