FROM debian:jessie
MAINTAINER cyril@dbyzero.com

#Auth purpose
COPY ./id_rsa /root/id_rsa

#Install packages needed
RUN apt-get update
RUN apt-get install -y nodejs npm git openssh-client vim pkg-config libcairo2-dev libjpeg62-turbo-dev libpango1.0-dev libgif-dev build-essential g++
RUN ln -s /usr/bin/nodejs /bin/node

#Get and prepare server code
WORKDIR /root
RUN export HOME=/root
RUN mkdir .ssh
RUN mv id_rsa .ssh
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone git@jupiter.oopss.net:/home/git/repo/deimos_asset
WORKDIR deimos_asset
RUN npm install
RUN npm install -g nodemon

#Run server
EXPOSE 80
CMD ["nodemon","app.js","--env=docker"]