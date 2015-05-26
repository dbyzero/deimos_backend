#!/bin/bash
docker run -d --name deimos_asset --link deimos_api:api -i -t -p 8080:80 dbyzero/deimos_asset:alpha
