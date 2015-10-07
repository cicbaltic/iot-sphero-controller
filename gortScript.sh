#!/bin/bash

#fully kills this script
trap ./killSphero.sh INT

#attemps to connect to a sphero
connect() {
    # takes mac as parameter
        GO=true
        CMD="bluez-test-serial -i hci0 $1" #68:86:E7:04:DC:7E
        stdbuf -oL $CMD 2>&1 | {
            while IFS= read -r line && "$GO" = true
            do
                lineA="$(echo "$line" | awk "{printf \$1}")"
                if [ "$lineA" == "Connected" ]
                    then
                    GO=false
                fi
            done
            if [ "$GO" == false ]
                then
                report=true
                while [ "$report" == true ]
                do
                    echo "Sphero $1 is connected."
                    sleep 10
                    report=$(isConnected $1)
                done
            fi
            ID="$(ps aux | grep "bluez-test-serial -i hci0 $1" | grep -v grep | awk "NR==1{printf \$2}")"
            if [ -n "$ID" ]
                then
                kill $ID
            fi
        }
        echo "Sphero $1 disconnected."
}

#checks whether a sphero is connected
isConnected() {
    # takes mac as parameter
    RES="$(l2ping -c 1 -t 1 -s 50 $1 2>&1 | awk "NR==2{printf \$1}")"
    HCI="$(hcitool con | grep $1 | grep "MASTER AUTH ENCRYPT")"
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

#main loop function
main() {
    while [ true ]
    do
        echo "Attempting connection to Sphero $1... "
        connect $1 #68:86:E7:04:DC:7E
        sleep 5
    done
}

#invocation for two spheros
main "68:86:E7:04:DC:7E" &
main "68:86:E7:04:98:35"
