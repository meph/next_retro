# Use an official Node runtime as the base image
FROM node:20

# ARG DATABASE_URL
# # Set environment variables
# ENV NODE_ENV=production
# ENV DATABASE_URL=${DATABASE_URL}

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npx prisma generate

#RUN npx prisma migrate dev

#RUN npx prisma migrate deploy

#RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
#CMD ["npm", "run", "start"]
CMD ["sh", "-c", "npm install && npx prisma generate && npx prisma migrate deploy && npm run build && npm run dev"]