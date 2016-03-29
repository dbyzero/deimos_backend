FROM debian:jessie
MAINTAINER cyril@dbyzero.com

#Install packages needed
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y git
RUN apt-get install -y openssh-client
RUN apt-get install -y vim
RUN apt-get install -y pkg-config
RUN apt-get install -y curl
#debug purpose
RUN apt-get install -y lynx

RUN ln -s /usr/bin/nodejs /bin/node

#Get and prepare server code
WORKDIR /root
RUN export HOME=/root
RUN mkdir .ssh
COPY id_rsa .ssh
RUN chmod 600 /root/.ssh/id_rsa
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone git@github.com:dbyzero/deimos_backend.git
WORKDIR deimos_backend

#nodejs 0.12
RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get install -y nodejs

RUN npm install
RUN npm install -g nodemon


#docker stuff
RUN apt-get install -y apt-transport-https ca-certificates
RUN apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
RUN mkdir -p /etc/apt/sources.list.d
RUN echo "deb https://apt.dockerproject.org/repo debian-jessie main" > /etc/apt/sources.list.d/docker.list
RUN apt-get update
RUN apt-get install -y docker-engine


#Run server
EXPOSE 80
CMD ["nodemon","app.js"]
VOLUME /root/deimos_backend
