ARG NODE_IMAGE_VERSION=20-alpine3.19

FROM node:$NODE_IMAGE_VERSION as builder
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build:docs

FROM node:$NODE_IMAGE_VERSION

COPY --from=builder package*.json ./
RUN npm install --production

COPY --from=builder dist dist
COPY --from=builder docs docs

RUN adduser -u 2004 -D docker
RUN chown -R docker:docker /docs

WORKDIR /src

CMD ["node", "/dist/src/index.js"]
