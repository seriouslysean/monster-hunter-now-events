#!/bin/bash

# Run npm start and capture the exit code
npm start
exit_code=$?

# Set the state variable based on the exit code
if [ $exit_code -eq 0 ]; then
    echo "::set-output name=feed_generated::1"
else
    echo "::set-output name=feed_generated::0"
fi
