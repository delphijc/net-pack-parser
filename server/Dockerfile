FROM node:22-alpine

WORKDIR /app

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

# Install dependencies based on package.json
COPY package*.json ./

# Install build dependencies for native modules (like 'cap', 'pcap-parser')
RUN apk add --no-cache python3 make g++ linux-headers libpcap-dev tshark

RUN npm install

# Copy source code and other necessary files
COPY . .
# Copy .gemini folder if it exists, though usually not needed for runtime.
# But COPY . . brings it all unless ignored.

# Build the TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
