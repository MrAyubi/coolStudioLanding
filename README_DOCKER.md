# Running Cool Studio with Docker

Everything here runs from the **repository root** (`coolwebsite/`) — the directory
holding `docker-compose.yml`, not `website/`.

You need Docker with Compose v2. Nothing else: no Node, no npm, no `nvm`. Verified on
Docker 28.3.3 / Compose v2.39.1.

```bash
docker --version && docker compose version
```

---

## TL;DR

```bash
docker compose up web     # production site  -> http://localhost
docker compose up dev     # live-editing     -> http://localhost:1234
```

Stop with `Ctrl+C`, or `docker compose down` if you started detached.

---

## The two modes

There are two Compose **services**, `web` and `dev`. Naming one on the command line
runs just that one.

> A note on terminology: these are plain services, **not** Compose `profiles`.
> Compose profiles are an opt-in mechanism where a service stays hidden until you pass
> `--profile <name>`. That indirection buys nothing with only two services, so it isn't
> used here — you select a mode by naming the service directly. The practical
> difference: a bare `docker compose up` starts **both** services at once (ports 80
> and 1234 together). That is usually not what you want; name the one you need.

### `web` — production

What ships. Parcel builds the optimized bundle, and nginx serves the result as static
files. There is no Node in the final image.

```bash
docker compose up web          # http://localhost
```

- Ports **80** and **443** → the same nginx server (the ports the VPS serves the domain
  on). `https://localhost` works too, but its certificate is self-signed, so the browser
  warns about it. That's expected: the certificate is only there for ParsPack's CDN,
  which doesn't verify it. Visitors see the CDN's own certificate.
- Image `coolstudio-web`, ~93 MB (mostly the site's own video and image assets)
- `restart: unless-stopped` — comes back after a reboot or daemon restart
- Has a healthcheck, so `docker compose ps` reports `healthy` rather than just `Up`
- Serves gzip for text assets, and `Cache-Control: public, max-age=31536000, immutable`
  for content-hashed assets; HTML is `no-cache` so a rebuild is always picked up

**Source changes do not appear automatically in this mode.** The site is baked into the
image at build time. To see an edit, rebuild:

```bash
docker compose up --build web
```

Use `web` when you want to check the real production output, test performance, or hand
someone a working site.

### `dev` — live editing

Runs the Parcel dev server with hot reload, the container equivalent of `npm run dev`.

```bash
docker compose up dev          # http://localhost:1234
```

- Port **1234**
- `website/src` is bind-mounted into the container, so editing a file on your machine
  rebuilds inside the container within a second or two — no restart, no rebuild
- Image `coolstudio-dev`, ~625 MB (it contains the full toolchain; it is never deployed)

Use `dev` for day-to-day work.

### Side by side

|  | `web` | `dev` |
|---|---|---|
| URL | http://localhost | http://localhost:1234 |
| Serves | nginx + built `dist/` | Parcel dev server |
| Hot reload | no | yes |
| Node at runtime | no | yes |
| Image size | ~93 MB | ~625 MB |
| Picking up a code edit | `--build` rebuild | automatic |
| Good for | verifying production, sharing | writing code |

---

## Everyday commands

```bash
# Start in the background instead of holding the terminal
docker compose up -d web

# Follow logs (Parcel build output and errors land here)
docker compose logs -f dev

# What is running, and is it healthy?
docker compose ps

# Stop and remove containers
docker compose down

# Rebuild images without starting anything
docker compose build

# Force a rebuild ignoring all cached layers
docker compose build --no-cache

# Open a shell inside a running container
docker compose exec dev sh
docker compose exec web sh
```

### When to rebuild

| You changed | What to run |
|---|---|
| Anything in `website/src` | `dev`: nothing. `web`: `docker compose up --build web` |
| `package.json` / `package-lock.json` | `docker compose up --build <service>` (both modes) |
| `Dockerfile`, `nginx.conf` | `docker compose up --build <service>` |
| `docker-compose.yml` | `docker compose up <service>` |

The dependency install is a separate cached layer, so a source-only rebuild skips
`npm ci` entirely and finishes in seconds.

---

## How the build works

`Dockerfile` has four stages. Compose picks a stage with `target:`.

```
deps  ──┬──> dev      (target: dev)     Parcel dev server, port 1234
        │
        └──> build ──> runtime          nginx serving dist/, ports 80 + 443
                       (target: runtime)
```

- **`deps`** — `node:22-bookworm-slim` (matching `website/.nvmrc`), copies only
  `package.json` + `package-lock.json`, runs `npm ci`. Manifests are copied *before*
  the source so this layer is cached until dependencies actually change.
  Debian slim rather than Alpine because Parcel ships native binaries
  (`@parcel/rust`, `lightningcss`, `@parcel/watcher`) and glibc is the well-trodden
  path for them.
- **`dev`** — adds the source and runs Parcel. Note it does *not* reuse the `dev` npm
  script, which passes `--open`; there is no browser inside a container to open.
- **`build`** — adds the source and runs `npx parcel build 'src/*.html'`, producing
  `/app/dist`. Both entry points are built: `index.html` and `studio-intro.html`.
- **`runtime`** — `nginx:1.27-alpine` with `dist/` copied to the web root and no Node.
  It adds `openssl` and `origin-cert.sh`, which makes a self-signed certificate for
  port 443 when the container first starts (mount a real one over
  `/etc/nginx/certs/origin.crt` + `origin.key` to replace it).

### Two details that matter

**The build context is the repository root, not `website/`.** All the project's code
lives one level down, so the `COPY` instructions are written as `COPY website/src ./src`.
This keeps `Dockerfile`, `docker-compose.yml` and `.dockerignore` together at the root —
`.dockerignore` is only read from the context root, so moving it would split the files up.

**`.dockerignore` is load-bearing.** Without it, every build would upload `node_modules`
(210 MB), `dist/` (94 MB) and `.parcel-cache/` (41 MB) to the Docker daemon. It cuts the
context from ~345 MB to ~52 MB. If builds suddenly get slow, check it first.

---

## Troubleshooting

**Port already in use**

Something else holds 80, 443 or 1234 (a local Apache or nginx often owns 80). Either stop it, or remap the host side — only the
left number changes:

```yaml
ports:
  - "3000:80"      # web, now at http://localhost:3000
  - "3443:443"     # and https://localhost:3443
```

**`dev` doesn't pick up my edits**

Confirm the container sees the change:

```bash
docker compose exec dev cat /app/src/assets/styles/base.scss | tail -5
```

If your edit is there but the served output is wrong, it's a stale Parcel cache:

```bash
docker compose up -d --force-recreate dev
```

Hot reload is verified on Linux. On macOS via Docker Desktop it's expected to work but
hasn't been tested here; if file watching misbehaves, fall back to `web` with `--build`.

**I changed `package.json` and nothing happened**

Dependencies are installed into the image, and only `website/src` is mounted. Rebuild:

```bash
docker compose up --build dev
```

**A deleted CSS rule is still showing up**

Parcel's cache going stale — a pre-existing quirk, documented in `website/CLAUDE.md`.
`.parcel-cache` is deliberately *not* kept in a named volume here, precisely so that
recreating the container clears it:

```bash
docker compose up -d --force-recreate dev
```

**`web` says `unhealthy`**

Check what the healthcheck saw:

```bash
docker inspect -f '{{json .State.Health}}' coolwebsite-web-1
```

Note the healthcheck deliberately targets `127.0.0.1`, not `localhost`: inside the
container `localhost` resolves to IPv6 `::1` first, while nginx binds IPv4 only, so
`localhost` yields a confusing connection-refused.

**Start completely fresh**

```bash
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up web
```

---

## Deploying the production image

The `web` image is self-contained — it needs no Compose, no bind mounts and nothing
from the host:

```bash
docker compose build web
docker run --rm -p 80:80 -p 443:443 coolstudio-web
```

The site must be served from the **web root**, not a sub-path. To push it to a
registry, tag it first:

```bash
docker tag coolstudio-web <registry>/<user>/coolstudio-web:latest
docker push <registry>/<user>/coolstudio-web:latest
```

---

## Running without Docker

Still supported, and unchanged. Requires Node 22 (`website/.nvmrc`):

```bash
cd website
npm install
npm run dev      # http://localhost:1234
npm run build    # -> website/dist
```

The Docker setup does not touch `website/node_modules` or `website/dist`, so the two
workflows can coexist on the same checkout.
