#!/bin/bash

aws s3 sync ./  s3://sr-comment-and-gift-viewer/ --profile hinomi-prod --exclude "*" --include "*.png" --include "*.css" --include "*.html" --include "*.js" --exclude "node_modules/*" --exclude "webpack.config.js" --exclude "src/*"
