#!/bin/sh

npm run protractor -- protractor-dd-e2e-browserstack.conf.js --params.template=$1 --params.templateId=$2 --params.envObj=$3
