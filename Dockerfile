FROM node:20

RUN apt update -y
RUN apt install chromium -y

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY dist dist
COPY .env .

EXPOSE 3000

CMD ["node", "dist/main.js"]
