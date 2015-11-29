#!/bin/bash
docker rm -f puck_backend
docker run -d --name puck_backend -v ~/repository/puck/backend:/root/puck_backend --link deimos_api:api -i -t -p 3333:3333 dbyzero/puck_backend:alpha
