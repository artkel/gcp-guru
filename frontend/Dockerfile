# 1. Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package.json files for both root and frontend
# This allows us to install dependencies and leverage Docker's cache
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies for the root directory
RUN npm install

# Install dependencies for the frontend directory
# Using --prefix is a clean way to target a subdirectory
RUN npm install --prefix frontend

# Copy the rest of the source code
COPY . .

# Set the backend API URL for the Next.js build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Debug: Print the environment variable
RUN echo "Building with NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}"

# Build the frontend directly in the frontend directory
WORKDIR /app/frontend
RUN npm run build
WORKDIR /app

# ---

# 2. Production Stage
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy only the necessary production artifacts from the builder stage
# We only need the contents of the 'frontend' directory
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/next.config.js ./

EXPOSE 3000

# The start command is in the frontend's package.json ("next start")
# Honor the Cloud Run PORT env var and bind to 0.0.0.0
CMD ["sh", "-c", "npm start -- --port ${PORT:-3000}"]