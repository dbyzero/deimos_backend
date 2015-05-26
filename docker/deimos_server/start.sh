#!/bin/bash
docker run -d --name game_server_$1 -i -t -p $1:1337 --link deimos_api:api dbyzero/deimos_server:alpha
