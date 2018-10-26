FROM alpine:3.8
MAINTAINER Phillip Zedalis <phillip@serverwarp.com>

# Get updates
RUN apk update
RUN apk upgrade

# Install NodeJS & NPM
RUN apk add nodejs
RUN apk add npm

# Install js-yaml
# https://github.com/nodeca/js-yaml
RUN npm install -g js-yaml