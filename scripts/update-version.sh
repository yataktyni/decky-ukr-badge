#!/bin/bash

# Get the version from package.json
VERSION=$(jq -r .version < package.json)

# Update the version in plugin.json
jq ".version = \"$VERSION\"" < plugin.json > plugin.json.tmp
mv plugin.json.tmp plugin.json 