FROM node:16-alpine
WORKDIR /app
ARG STRAPI_URL
ENV STRAPI_URL=$STRAPI_URL
COPY ["./package.json", "./yarn.lock", "./"]
RUN yarn
COPY . .
RUN yarn build
EXPOSE 3000 3002
CMD ["yarn", "start"]