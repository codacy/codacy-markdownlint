ARG NODE_IMAGE_VERSION=16.10.0-alpine

FROM node:$NODE_IMAGE_VERSION as documentation
WORKDIR /src
COPY ./doc-generator/package.json package.json
RUN npm install
COPY doc-generator/. /src/
COPY docs/ /docs
RUN npm run compile && node dist/index.js

FROM node:$NODE_IMAGE_VERSION as builder
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run compile

FROM node:$NODE_IMAGE_VERSION

COPY --from=builder package*.json ./
RUN npm install --production

COPY --from=builder dist dist
COPY --from=documentation /docs/ docs/

RUN adduser -u 2004 -D docker
RUN chown -R docker:docker /docs

WORKDIR /src

CMD ["node", "/dist/src/index.js"]
