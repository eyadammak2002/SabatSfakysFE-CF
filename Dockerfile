FROM node:20.18.2

WORKDIR /app

COPY package*.json ./

RUN npm install -g @angular/cli@15.2.7

RUN npm install --legacy-peer-deps

# Ignore the Angular cache
COPY . .

CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]