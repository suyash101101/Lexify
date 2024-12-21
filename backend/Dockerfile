# Use the official Redis image from Docker Hub
FROM redis/redis-stack:latest

# Set the working directory (optional)
WORKDIR /data

# Expose the necessary ports
EXPOSE 6379 8001

# Healthcheck command to ensure Redis is running
HEALTHCHECK CMD redis-cli ping

# Command to run Redis server
CMD ["redis-server"]
