FROM node:10.0 AS builder

# Set the working directory in the container to /app
WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install

# Copy the current directory contents into the container at /app
ADD . /app

 # Expose the port the app runs in
EXPOSE 8100

# Serve the app
CMD ["node", "./bin/www"]
