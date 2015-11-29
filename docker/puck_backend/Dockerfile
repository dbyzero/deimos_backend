FROM debian:jessie
MAINTAINER cyril@dbyzero.com

#Auth purpose
COPY ./id_rsa /root/id_rsa

#Install packages needed
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y git
RUN apt-get install -y openssh-client
RUN apt-get install -y vim
RUN apt-get install -y pkg-config
RUN apt-get install -y nginx
RUN npm install -g npm
RUN npm install -g brunch
RUN ln -s /usr/bin/nodejs /bin/node

#Get and prepare server code
WORKDIR /root
RUN export HOME=/root
RUN mkdir .ssh
RUN mv id_rsa .ssh
RUN chmod 600 /root/.ssh/id_rsa
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone git@github.com:dbyzero/puck_backend.git
WORKDIR puck_backend

#nodejs 0.12
#RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -
#RUN apt-get install -y nodejs

RUN npm install

#Run server
EXPOSE 80
#todo load nginx
CMD ["nginx","app.js","--env=docker"]
VOLUME /root/puck_server
