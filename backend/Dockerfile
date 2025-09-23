FROM node:20
WORKDIR /app
RUN echo "Copying files...."
COPY . .
RUN npm install
CMD ["npm", "run", "start"]
EXPOSE 5101