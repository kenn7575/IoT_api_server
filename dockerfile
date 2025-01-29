FROM node:20

WORKDIR /app

COPY package*.json ./

COPY ./entryPoint.sh .

COPY ./src .

COPY ./prisma .

COPY ./tsconfig.json .

RUN npm install

RUN npx prisma generate

RUN npm run build

RUN ["chmod", "+x", "./entryPoint.sh"]

RUN sed -i -e 's/\r$//' ./entryPoint.sh

ENTRYPOINT ["./entryPoint.sh"]
EXPOSE 3000


CMD ["npm", "start"]
