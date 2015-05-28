FROM debian:jessie
MAINTAINER cyril@dbyzero.com

#Auth purpose
COPY ./id_rsa /root/id_rsa

#Install packages needed
RUN apt-get update
RUN apt-get install -y nodejs npm git openssh-client vim
RUN ln -s /usr/bin/nodejs /bin/node

#Get and prepare server code
WORKDIR /root
RUN mkdir .ssh
RUN mv id_rsa .ssh
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone https://dbyzero:iss4ever\$@github.com/dbyzero/deimos_server.git
# RUN git clone git@jupiter.oopss.net:/home/git/repo/deimos_server
WORKDIR deimos_server
RUN npm install
RUN npm install -g nodemon

#VOLUME /data

#Run server
EXPOSE 80
CMD ["nodemon","app.js","--env=docker"]
