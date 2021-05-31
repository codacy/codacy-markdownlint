ARG NODE_IMAGE_VERSION=15-alpine

FROM node:$NODE_IMAGE_VERSION as builder

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run compile
#RUN npm test

# FROM node:$NODE_IMAGE_VERSION

# COPY --from=builder dist dist
# COPY --from=builder package.json ./
# COPY --from=builder package-lock.json ./
# COPY --from=builder docs docs

# RUN npm install --production

RUN rm -rf /package.json /package-lock.json

RUN adduser -u 2004 -D docker
RUN chown -R docker:docker /docs

WORKDIR /src

CMD ["node", "/dist/src/index.js"]
