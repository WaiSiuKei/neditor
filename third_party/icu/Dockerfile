FROM surferseo/emsdk

RUN mv /etc/apt/sources.list /etc/apt/sources.list.bak && \
    echo deb http://mirrors.ustc.edu.cn/debian buster main contrib non-free >/etc/apt/sources.list && \
    echo deb http://mirrors.ustc.edu.cn/debian buster-updates main contrib non-free >>/etc/apt/sources.list && \
    echo deb http://mirrors.ustc.edu.cn/debian buster-backports main contrib non-free >>/etc/apt/sources.list && \
    echo deb http://mirrors.ustc.edu.cn/debian-security/ buster/updates main contrib non-free >>/etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y git

WORKDIR /
RUN git clone https://github.com/unicode-org/icu
RUN cd /icu && git checkout bb7b8481bdce7eb8ac40b3dbfd0a567b3c754cd6
RUN mv /icu/icu4c /icu/icu

COPY ./build /build
WORKDIR /build

# for `source /emsdk/emsdk_env.sh` to work
SHELL ["/bin/bash", "-c"]

RUN cp /build/icu.py /emsdk/emscripten/master/tools/ports
RUN mkdir -p /artifacts
RUN source /emsdk/emsdk_env.sh; EMCC_LOCAL_PORTS="icu=/icu" emcc --bind icu.cc -s USE_ICU=1 -o /artifacts/icu-binding.js --no-entry -s "EXPORTED_RUNTIME_METHODS=['intArrayFromString', 'allocateUTF8', 'getValue', 'setValue']" -s WASM=1 -s MODULARIZE  -s ERROR_ON_UNDEFINED_SYMBOLS=0
