FROM debian:jessie
MAINTAINER cyril@dbyzero.com

#Install packages needed
RUN apt-get update
RUN apt-get install -y nodejs npm git openssh-client mongodb supervisor vim
RUN ln -s /usr/bin/nodejs /bin/node

#mongodb directory
RUN mkdir -p /data/db
RUN mkdir -p /var/log/supervisor
RUN mkdir -p /etc/supervisor/conf.d

#supervisord

#Get and prepare server code
WORKDIR /root
RUN mkdir .ssh
COPY ./id_rsa /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa
RUN echo 'StrictHostKeyChecking=no ' >>  /etc/ssh/ssh_config
RUN git clone git@github.com:dbyzero/deimos_api.git
WORKDIR deimos_api
RUN npm install
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN npm install -g nodemon

#Run server
CMD ["/usr/bin/supervisord"]
EXPOSE 80

VOLUME /root/deimos_api
