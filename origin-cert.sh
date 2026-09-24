#!/bin/sh
# Gives nginx a certificate for its port-443 listener. The nginx image runs
# every executable in /docker-entrypoint.d/ before it starts nginx.
#
# Visitors never see this certificate. ParsPack's CDN answers them with its
# own Let's Encrypt certificate, then connects to this origin over HTTPS too,
# and it doesn't verify the origin's certificate (tested 2026-09-24 with a
# self-signed one). So a self-signed certificate made here is enough. It's
# created on the container's first start and kept until the container is
# recreated.
#
# To use a real certificate instead, mount it over /etc/nginx/certs/origin.crt
# and origin.key. This script leaves existing files alone.
set -eu

dir=/etc/nginx/certs
if [ -s "$dir/origin.crt" ] && [ -s "$dir/origin.key" ]; then
    exit 0
fi

mkdir -p "$dir"
openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
    -subj "/CN=verycoolcreative.studio" \
    -addext "subjectAltName=DNS:verycoolcreative.studio,DNS:www.verycoolcreative.studio,DNS:localhost,IP:127.0.0.1" \
    -keyout "$dir/origin.key" -out "$dir/origin.crt" 2>/dev/null
chmod 600 "$dir/origin.key"
echo "$0: generated a self-signed certificate in $dir"
