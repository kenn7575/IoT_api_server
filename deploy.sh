#!/bin/bash

# Configuration
SERVER="kenn7575@192.168.1.50" # Replace with your server's SSH user and hostname
BLUE_PORT=3002
GREEN_PORT=3001
IMAGE_NAME="express-app:new" # Name of the Docker image to create and deploy
LOCAL_BUILD_DIR="." # Directory containing the Dockerfile (e.g., current directory)

# Load environment variables from .env file
if [ -f production.env ]; then
  export $(grep -v '^#' production.env | xargs)
else
  echo "Error: production.env file not found."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  exit 1
fi
echo "docker run --platform linux/arm64 -d --restart always --name express-app-$NEW_COLOR -p $NEW_PORT:3000 -e DATABASE_URL='$DATABASE_URL' $IMAGE_NAME"

echo "DATABASE_URL=$DATABASE_URL" # Debug output

# Step 1: Build the Docker image locally
echo "Building Docker image: $IMAGE_NAME"
docker buildx build --platform linux/arm64 --build-arg DATABASE_URL=\"$DATABASE_URL\" -t "$IMAGE_NAME" "$LOCAL_BUILD_DIR"

if [ $? -ne 0 ]; then
  echo "Error: Failed to build the Docker image."
  exit 1
fi

# Step 2: Transfer the Docker image to the remote server
echo "Saving and transferring Docker image to $SERVER..."
docker save "$IMAGE_NAME" | ssh "$SERVER" "docker load"
if [ $? -ne 0 ]; then
  echo "Error: Failed to transfer the Docker image to the remote server."
  exit 1
fi

# Step 3: Determine the current live environment (Blue or Green)
CURRENT_COLOR=$(ssh "$SERVER" "if docker ps | grep -q 'express-app-blue'; then echo 'blue'; else echo 'green'; fi")
if [ "$CURRENT_COLOR" == "blue" ]; then
  NEW_COLOR="green"
  CURRENT_PORT=$BLUE_PORT
  NEW_PORT=$GREEN_PORT
else
  NEW_COLOR="blue"
  CURRENT_PORT=$GREEN_PORT
  NEW_PORT=$BLUE_PORT
fi

echo "Current live environment: $CURRENT_COLOR"
echo "Deploying new version to: $NEW_COLOR"

# Step 4: Ensure no conflict with the new container name
echo "Stopping and removing any existing container for $NEW_COLOR..."
ssh "$SERVER" "docker stop express-app-$NEW_COLOR && docker rm express-app-$NEW_COLOR" || true

# Step 5: Deploy the new container on the remote server
echo "Starting new container: express-app-$NEW_COLOR"
ssh "$SERVER" "docker run --platform linux/arm64 -d --restart always --name express-app-$NEW_COLOR -p $NEW_PORT:3000 -e DATABASE_URL=\"$DATABASE_URL\" $IMAGE_NAME"
if [ $? -ne 0 ]; then
  echo "Error: Failed to start the new container on the remote server."
  exit 1
fi

# Step 6: Test the new environment
echo "Testing the new environment on port $NEW_PORT..."
MAX_RETRIES=10
RETRY_DELAY=2
SUCCESS=false

for i in $(seq 1 $MAX_RETRIES); do
  TEST_RESULT=$(ssh "$SERVER" "curl -s http://127.0.0.1:$NEW_PORT/test")
  if echo "$TEST_RESULT" | grep -q 'connection successful'; then
    echo "New container is ready."
    SUCCESS=true
    break
  fi
  echo "Retry $i/$MAX_RETRIES: New container is not ready yet. Retrying in $RETRY_DELAY seconds..."
  sleep $RETRY_DELAY
done

if [ "$SUCCESS" = false ]; then
  echo "Error: New container failed to start within the timeout. Cleaning up..."
  ssh "$SERVER" "docker stop express-app-$NEW_COLOR && docker rm express-app-$NEW_COLOR"
  exit 1
fi

# Step 7: Update NGINX to point to the new environment
echo "Updating NGINX configuration to point to the new port: $NEW_PORT..."
ssh "$SERVER" "sudo sed -i '/proxy_pass/s/$CURRENT_PORT/$NEW_PORT/' /etc/nginx/sites-available/express-app && sudo nginx -s reload"
if [ $? -ne 0 ]; then
  echo "Error: Failed to update NGINX configuration."
  exit 1
fi

# Step 8: Clean up the old container
echo "Stopping and removing old container: express-app-$CURRENT_COLOR"
ssh "$SERVER" "docker stop express-app-$CURRENT_COLOR && docker rm express-app-$CURRENT_COLOR"
if [ $? -ne 0 ]; then
  echo "Error: Failed to clean up the old container."
  exit 1
fi

# Step 9: Clean up unused images
echo "Cleaning up unused Docker images..."
ssh "$SERVER" "docker image prune -f"
if [ $? -ne 0 ]; then
  echo "Error: Failed to clean up old images."
  exit 1
fi

echo "Deployment complete! New live environment: $NEW_COLOR"
