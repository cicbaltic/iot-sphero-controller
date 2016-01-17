FROM node:5.4.1
MAINTAINER Gytis Raciukaitis<gytis.raciukaitis@lt.ibm.com>

RUN apt-get update && apt-get install -y build-essential libbluetooth-dev
# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
COPY ./package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

CMD [ "npm", "start" ]
