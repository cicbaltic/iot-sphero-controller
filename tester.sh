#!/bin/bash
isConnected() {
    # takes mac as parameter
    RES="$(l2ping -c 1 -t 1 -s 50 $1 2>&1 | awk "NR==2{printf \$1}")"
    HCI="$(hcitool con | grep $1 | grep "MASTER AUTH ENCRYPT")"

    echo RES=$RES
    echo HCI=$HCI

    if [ "$RES" == "50" ]
        then
        if [ -n "$HCI" ]
            then
            echo true
        else
            echo false
        fi
    else
        echo false
    fi
}

VAR=$(isConnected 68:86:E7:04:DC:7E )

#echo "$(l2ping -c 1 -t 1 -s 50 $1 2>&1 | awk "NR==2{printf \$1}")"

echo $VAR
