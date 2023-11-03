#!/bin/bash

# Initialize the CONTINUE_NEXT environment variable
export CONTINUE_NEXT=1

# Run the first script
npm run fetch:all-articles

# Check if the environment variable is set and is 1 (meaning continue to the next script)
if [ "$CONTINUE_NEXT" -eq "1" ]; then
    # Run the second script
    npm run generate:events-json
fi

# Check if the environment variable is set and is 1 (meaning continue to the next script)
if [ "$CONTINUE_NEXT" -eq "1" ]; then
    # Run the third script
    npm run generate:events-ics
fi
