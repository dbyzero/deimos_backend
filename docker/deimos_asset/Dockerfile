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
RUN apt-get install -y libcairo2-dev 
RUN apt-get install -y libjpeg62-turbo-dev 
RUN apt-get install -y libpango1.0-dev 
RUN apt-get install -y libgif-dev 
RUN apt-get install -y build-essential
RUN apt-get install -y g++
RUN ln -s /usr/bin/nodejs /bin/node

#Get and prepare server code
WORKDIR /root
RUN export HOME=/root
RUN mkdir .ssh
RUN mv id_rsa .ssh
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone https://dbyzero:iss4ever\$@github.com/dbyzero/deimos_asset.git
# RUN git clone git@jupiter.oopss.net:/home/git/repo/deimos_asset
WORKDIR deimos_asset
RUN npm install
RUN npm install -g nodemon

#Run server
EXPOSE 80
CMD ["nodemon","app.js","--env=docker"]