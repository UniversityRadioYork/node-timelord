# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=20.11.1
ARG OS=buster

FROM node:${NODE_VERSION}-${OS}
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . .
RUN npm install grunt-cli -g
RUN npm i --ignore-scripts
EXPOSE 8000
CMD grunt
