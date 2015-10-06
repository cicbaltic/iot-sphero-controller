#!/bin/bash
killThis() {
    echo "killing process $1..."
    kill $1
    ID="$(ps aux | grep 'bluez-test-serial\|gortScript' | grep -v grep | awk "NR==1{printf \$2}")"
    if [ -n "$ID" ]
        then
        killThis $ID
    else
        echo "done"
    fi
}

killThis "$(ps aux | grep 'bluez-test-serial\|gortScript' | grep -v grep | awk "NR==1{printf \$2}")"
