FROM node:8-alpine

WORKDIR /js-yaml

COPY . .
RUN npm install

ENTRYPOINT [ "node", "/js-yaml/bin/js-yaml.js" ]

WORKDIR /
