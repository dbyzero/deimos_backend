#!/bin/bash
docker rm -f deimos_asset
docker run -d --name deimos_asset -v ~/repository/deimos/deimos_asset:/root/deimos_asset --link deimos_api:api -i -t -p 8080:80 dbyzero/deimos_asset:alpha
