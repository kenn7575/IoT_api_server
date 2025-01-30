# start with base image running linux
FROM node:20

# set working directory - where the source code will live
WORKDIR /app

# copy stuff from the host machine to the container
COPY package*.json ./

COPY ./entryPoint.sh .

COPY ./src .

COPY ./prisma .

COPY ./tsconfig.json .

# install dependencies
RUN npm install

# generate prisma client
RUN npx prisma generate

# build the app
RUN npm run build

 # before running the app, we need to make the entryPoint.sh file executable
 # this will push prisma schema to the production database
RUN ["chmod", "+x", "./entryPoint.sh"]
RUN sed -i -e 's/\r$//' ./entryPoint.sh
ENTRYPOINT ["./entryPoint.sh"]

# expose the port to make the app accessible from the outside
EXPOSE 3000

# run the app
CMD ["npm", "start"]
