#!/bin/bash
docker rm -f deimos_api
docker run --name deimos_api -v ~/repository/deimos/deimos_api:/root/deimos_api -i -t -d -p 39999:80 dbyzero/deimos_api:alpha
