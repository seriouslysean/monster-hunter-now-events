#!/bin/bash

CURRENTDATE=`date +"%Y-%m-%d %T"`

git add . && \
git commit -m "Article fetch $CURRENTDATE" && \
npm version patch
