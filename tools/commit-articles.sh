#!/bin/bash

# This script is used in tandem with `npm start` to save and commit the results

CURRENTDATE=`date +"%Y-%m-%d %T"`

git add . && \
git commit -m "Article fetch $CURRENTDATE" && \
npm version patch
