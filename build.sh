#!/usr/bin/env bash

set -euo pipefail

NVM_NODEJS_ORG_MIRROR=https://jxcore.azureedge.net
export NVM_NODEJS_ORG_MIRROR
JX_NPM_JXB=jxb311
export JX_NPM_JXB

npm install
jx node_modules/jxc/bin/jxc.bin.js install 0.1.7 --use-url http://jxcore.azureedge.net/jxcore-cordova/0.1.7/release/io.jxcore.node.jx

cd www/jxcore
jx npm install --no-optional --autoremove "*.gz"
find . -name "*.gz" -delete

cd ..
bower install

cd ..
cordova platform add android
cordova build android --device


