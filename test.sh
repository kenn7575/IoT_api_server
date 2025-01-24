SERVER="kenn7575@192.168.1.50" # Replace with your server's SSH user and hostname
NEW_PORT=3002

for i in {1..10}; do
  TEST_RESULT=$(ssh "$SERVER" "curl  http://192.168.1.50:$NEW_PORT/test")
  echo "DEBUG: Curl output: $TEST_RESULT"
  if echo "$TEST_RESULT" | grep -q 'connection successful'; then
    echo "New container is ready."
    break
  fi
  echo "Retrying in 2 seconds..."
  sleep 2
done
