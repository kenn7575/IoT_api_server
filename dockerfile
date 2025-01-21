FROM node:20

WORKDIR /app

COPY package*.json ./

COPY ./src .

COPY ./prisma .

COPY ./tsconfig.json .

RUN npm install

RUN npx prisma generate

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
