# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps - shared dependency layer for both the dev and production paths.
#
# Debian slim rather than Alpine: Parcel ships native binaries (@parcel/rust,
# lightningcss, @parcel/watcher) and glibc is the well-trodden path for them.
# The final image is nginx, so this stage's size doesn't ship anywhere.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# Manifests only, so the install layer is cached until dependencies change.
COPY website/package.json website/package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# dev - Parcel dev server with hot reload. Sources are bind-mounted over ./src
# at runtime by docker-compose; the COPY here just gives the image a sane
# standalone baseline.
# ---------------------------------------------------------------------------
FROM deps AS dev

COPY website/src ./src

EXPOSE 1234

# The 'dev' npm script passes --open, which has no browser to open in a
# container, so the command is spelled out here without it. Parcel expands the
# glob itself - it is not a shell glob.
CMD ["npx", "parcel", "src/*.html", "--host", "0.0.0.0", "--port", "1234"]

# ---------------------------------------------------------------------------
# build - produces the optimized static site in /app/dist
# ---------------------------------------------------------------------------
FROM deps AS build

COPY website/src ./src

RUN npx parcel build 'src/*.html'

# ---------------------------------------------------------------------------
# runtime - nginx serving the built site. No Node at runtime.
#
# The site must be served from the web root: src/assets/styles/base.scss
# references the streetOfRage font by the absolute path /assets/fonts/...,
# which breaks under any sub-path.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# openssl makes the self-signed certificate for port 443 (origin-cert.sh). The
# nginx image doesn't include it.
RUN apk add --no-cache openssl

COPY --chmod=755 origin-cert.sh /docker-entrypoint.d/40-origin-cert.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
