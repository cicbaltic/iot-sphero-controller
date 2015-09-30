#!/bin/bash

HCIPROC="$(ps aux | grep "bluez-test-serial -i hci0 68:86:E7:04:98:35" | grep -v grep | awk "NR==1{printf \$2}")"

echo $HCIPROC
