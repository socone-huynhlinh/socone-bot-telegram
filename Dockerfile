# Base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (bao gồm cả devDependencies)
RUN apt-get update && apt-get install -y iputils-ping
RUN apt-get update && apt-get install -y net-tools

RUN npm install

# Copy toàn bộ project files vào container
COPY . .

# Cài đặt nodemon global để hỗ trợ hot-reload
RUN npm install -g nodemon

# Expose port 3000
EXPOSE 3000

# Set the command to start the application in development mode
CMD ["npm", "run", "dev"]