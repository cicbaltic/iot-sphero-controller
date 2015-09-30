#!/bin/bash
# 68:86:E7:04:98:35   68:86:E7:04:DC:7E
MAC="68:86:E7:04:98:35"
CMD="$(ps aux | grep $MAC | grep -v grep | awk "NR==1{printf \$2}")"
until [ -z "$CMD" ]
do
    CMD="$(ps aux | grep $MAC | grep -v grep | awk "NR==1{printf \$2}")"
    kill $CMD
done

MAC="68:86:E7:04:DC:7E"
CMD="$(ps aux | grep $MAC | grep -v grep | awk "NR==1{printf \$2}")"
until [ -z "$CMD" ]
do
    CMD="$(ps aux | grep $MAC | grep -v grep | awk "NR==1{printf \$2}")"
    kill $CMD
done


#"bluez-test-serial -i hci0 68:86:E7:04:98:35"
