#FROM node:16.3.0-alpine
FROM ubuntu:20.04

RUN apt update && apt upgrade && \
    apt install -y git vim curl build-essential gcc g++ make libssl-dev

RUN useradd -ms /bin/bash cobdev

RUN mkdir /work
RUN chown -R cobdev /work
WORKDIR /work

USER cobdev
RUN mkdir -p /home/cobdev/.ssh
RUN chmod  0700 /home/cobdev/.ssh
RUN echo 'export PS1="[cob-cli@docker] \W # "' >> /home/cobdev/.bash_profile
RUN echo 'alias ll="ls -alF --group-directories-first"' >> /home/cobdev/.bash_profile

# Install node and npm with nvm
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
RUN bash -c 'source /home/cobdev/.nvm/nvm.sh   && \
    nvm install 16.20.2                 && \
    nvm alias default 16.20.2           && \
    nvm use default                     '
ENV PATH /home/cobdev/.nvm/versions/node/v16.20.2/bin:$PATH

# Prepare cob-cli
USER root
RUN mkdir /cob-cli
WORKDIR /cob-cli
COPY . .
RUN rm -rf node_modules .idea
RUN chown -R cobdev /cob-cli


USER cobdev
ENV SHELL="bash"
RUN npm install
RUN npm install -g

RUN git config --global core.autocrlf input
RUN git config --global core.filemode false

EXPOSE 8040

COPY docker/init.sh /
ENTRYPOINT [ "/init.sh" ]
