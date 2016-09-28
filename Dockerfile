FROM node:6
EXPOSE 8080
VOLUME ["/project"]
ENV PATH "/node_modules/.bin:$PATH"
ENV NODE_DOCKER_MODULES "/node_modules"
WORKDIR /
COPY package.json /package.json
RUN npm i --registry=http://npm.avlyun.org

WORKDIR /project
ENTRYPOINT npm start