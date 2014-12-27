#!/bin/sh

if test -z "$1"; then
  echo "No branch/tag name provided"
  exit 1
fi

git clone --branch "$1" --depth 1 https://github.com/nodeca/js-yaml.git "$(dirname $0)/implementations/js-yaml-$1"
