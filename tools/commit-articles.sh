#!/bin/bash

# This script is used in tandem with `npm start` to save and commit the results

CURRENTDATE=`date +"%Y-%m-%d %T"`

git config --global user.email "$WORKFLOW_GIT_EMAIL"
git config --global user.name "$WORKFLOW_GIT_NAME"

git add . && \
git commit -m "Article fetch $CURRENTDATE" && \
npm version patch
