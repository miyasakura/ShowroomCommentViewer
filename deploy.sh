#!/bin/bash

./node_modules/.bin/webpack
aws cloudformation update-stack --profile hinomi-prod --template-body file://cloudformation.yaml --stack-name ShowroomCommentViewer
aws s3 sync ./  s3://sr-comment-and-gift-viewer/ --profile hinomi-prod --exclude "*" --include "*.png" --include "*.css" --include "*.html" --include "*.js" --exclude "node_modules/*" --exclude "webpack.config.js" --exclude "src/*"
aws cloudfront --profile hinomi-prod create-invalidation --distribution-id ER44UNV8EX7H2 --paths '/*'