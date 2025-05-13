FROM node:22-alpine as build

WORKDIR /app

COPY . /app/

RUN yarn install && yarn build

FROM horizoncd/horizon-web-base:v1.0.0

COPY --from=build /app/dist /usr/share/nginx/html

USER horizon

CMD ["nginx", "-g", "daemon off;"]
