#!/bin/bash
#bluez-test-serial -i hci0 68:86:E7:04:DC:7E 68:86:E7:04:98:35

killbtprocess() {
    BTPROC_INTERNAL="$(ps aux | grep "bluez-test-serial -i hci0 $1" | grep -v grep | awk "NR==1{printf \$2}")"
    if [ -n "$BTPROC_INTERNAL" ]
        then
        kill $BTPROC_INTERNAL
    fi
}

killbtprocess $1 &
killbtprocess $2 &

connectOrb() {
    HCICON="$(hcitool con | grep $1)"

    echo entering loop...
    while [ true ]
    do
        if [ -n "$HCICON" ]
            then
            echo Sphero $1 connected
            sleep 10
            HCICON="$(hcitool con | grep $1)"
            #CON=""
        else
            echo Sphero $1 not connected
            killbtprocess $1
            bluez-test-serial -i hci0 $1 2>&1 &
            sleep 3
            HCICON="$(hcitool con | grep $1)"
        fi
    done
}

connectOrb $1 &
connectOrb $2 &
