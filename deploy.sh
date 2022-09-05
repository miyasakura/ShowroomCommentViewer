#!/bin/bash

./node_modules/.bin/webpack
aws s3 sync ./  s3://sr-viewer.sacra.co/ --exclude "*" --include "*.png" --include "*.css" --include "*.html" --include "*.js" --exclude "node_modules/*" --exclude "webpack.config.js" --exclude "src/*"
