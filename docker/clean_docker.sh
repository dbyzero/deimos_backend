docker ps -a | awk '{print $1}' | xargs --no-run-if-empty docker rm -f
docker images -q | xargs docker rmi -f