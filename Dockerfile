# Use the official Node.js image as a base image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Generate environment variable file (if it doesn't exist)
RUN [ -f .env ] || cp .env.example .env

# Build the application
RUN npm run build

# Production environment
FROM node:20-alpine AS production

WORKDIR /app

# Copy dependencies and build files
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/.env ./.env
COPY --from=base /app/next.config.ts ./next.config.ts
COPY --from=base /app/scripts ./scripts

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]