#!/usr/bin/env bash

set -e

PRODUCT=cob-cli
PRODUCT_VERSION=$(cat package.json | jq -r '.version')

echo "**************************************************************************************"
echo "* Building docker image: $PRODUCT:$PRODUCT_VERSION                                    "
echo "**************************************************************************************"
docker build --platform linux/amd64 -f docker/Dockerfile -t cob/$PRODUCT:$PRODUCT_VERSION .

