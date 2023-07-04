#!/bin/bash
set -euo pipefail

#docker build . --file Dockerfile.emsdk -t emsdk

#docker build . --file Dockerfile.icu -t icu-data

rm -Rf build && mkdir build

docker run -v "$PWD/build:/opt/mount" --rm "$(docker images -q icu-data)" cp /artifacts/data.h /opt/mount
cp icu.cc icu.py build/
docker rmi icu-build || true
docker build . --file Dockerfile -t icu-build

docker run -v "$PWD/src:/opt/mount" --rm "$(docker images -q icu-build)" cp /artifacts/icu-binding.wasm /opt/mount
docker run -v "$PWD/src:/opt/mount" --rm "$(docker images -q icu-build)" cp /artifacts/icu-binding.js /opt/mount
