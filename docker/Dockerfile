FROM node:14.13.0-alpine
RUN mkdir -p /emaginer-app
WORKDIR /emaginer-app
COPY package.json ./
RUN npm install
COPY . .
ENTRYPOINT ["npm"]
CMD ["start"]

EXPOSE 3000