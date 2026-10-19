# Deployment Guide

Production deployment of the IoT Monitoring System on a single home server,
using prebuilt GHCR images, Docker Compose, Tailscale and a Cloudflare Tunnel.

> Status: this document describes the intended, supported procedure. The
> server-side steps (Tailscale OAuth, GHCR pull credentials, SSH host key,
> Cloudflare tunnel/DNS) must be performed by an operator with access to those
> accounts. Nothing here should be considered "already done".

---

## 1. Architecture

### What is exposed, and where

| Component | Reachable from | Port (container) | Notes |
| --- | --- | --- | --- |
| Frontend (nginx) | Public internet, via Cloudflare Tunnel | 80 | The ONLY public surface. Also proxies `/api` to the backend. |
| Backend API | Frontend only (internal network) | 3000 | No published port in production. |
| PostgreSQL | Internal network only | 5432 | Published only on `TAILSCALE_IP` when `compose.admin.yaml` is used. |
| Grafana | Tailnet / SSH port-forward only | 3000 | Private. Embedded dashboards are hidden in the public build. |
| Node-RED (editor + dashboard) | Tailnet / SSH port-forward only | 1880 | Editor requires login (`adminAuth`). |
| Adminer | Tailnet, opt-in only (`--profile tools`) | 8080 | Never part of a normal deploy. |

The public entry point is `https://<PUBLIC_HOSTNAME>` → Cloudflare Tunnel →
`http://127.0.0.1:5173` (frontend). Nothing else is routed.

### Files

| File | Purpose |
| --- | --- |
| `compose.yaml` | Base stack. Dev-friendly: publishes all ports, named volumes. |
| `compose.production.yaml` | Production overlay. `!reset`s ports, binds state to `/srv/appdata/iot-monitoring`, pins GHCR images. |
| `compose.admin.yaml` | Optional. Publishes admin UIs on `TAILSCALE_IP` only. |
| `deploy/.env` | Real production secrets (mode 600, never committed). |
| `deploy/.env.production.example` | Template for the above. |
| `deploy/generate-env.sh` | Generates `deploy/.env` with strong secrets. |
| `deploy/deploy.sh` | Deploy / roll back with health verification. |
| `deploy/backup.sh` | Database + state backups with retention. |
| `deploy/cloudflared/config.example.yml` | Tunnel ingress (frontend only). |

Requires **Docker Compose ≥ 2.24** (for the `!reset` / `!override` merge tags).

### Data locations (host)

| Host path | Content | Owner (uid) |
| --- | --- | --- |
| `/srv/appdata/iot-monitoring/postgres` | PostgreSQL data dir | 999 |
| `/srv/appdata/iot-monitoring/nodered` | Node-RED `/data` (flows, settings) | 1000 |
| `/srv/appdata/iot-monitoring/grafana` | Grafana state (SQLite) | 472 |
| `/srv/appdata/iot-monitoring/backend-logs` | Backend winston logs | 1001 |
| `/srv/appdata/iot-monitoring/backups` | Backups | operator |

`deploy/deploy.sh` creates these and fixes ownership automatically.

---

## 2. Prerequisites

**Server (Ubuntu/Debian assumed):**

- Docker Engine + Compose v2.24+
- `git`, `curl`, `openssl`
- `apache2-utils` (for `htpasswd`) **or** `python3` + `python3-bcrypt`
- Tailscale installed and joined to your tailnet (`tailscale ip -4`)
- Optionally `shellcheck` for local validation
- A dedicated, non-root deploy user in the `docker` group (e.g. `deploy`)
- Repo checked out at `/srv/appdata/compose/iot-monitoring`

**Accounts / external:**

- A Cloudflare account with your public hostname (DNS managed by Cloudflare)
- GHCR read access for the server (images are private): a PAT with `read:packages`
- A Tailscale OAuth client (for the GitHub Actions deploy job)

---

## 3. One-time server setup

```bash
# 1. Create the deploy user (once) and give it docker access
sudo adduser --disabled-password --gecos '' deploy
sudo usermod -aG docker deploy

# 2. Clone the repo where deploy.sh expects it
sudo mkdir -p /srv/appdata/compose
sudo chown deploy:deploy /srv/appdata/compose
sudo -u deploy git clone git@github.com:Vinayaksharma17/iot-monitoring-system.git \
  /srv/appdata/compose/iot-monitoring
cd /srv/appdata/compose/iot-monitoring

# 3. Authenticate to GHCR (so `docker compose pull` can fetch private images)
echo "$GHCR_PAT" | docker login ghcr.io -u Vinayaksharma17 --password-stdin

# 4. Generate production secrets (interactive; writes deploy/.env mode 600)
./deploy/generate-env.sh

# 5. Sanity-check the rendered configuration
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml config -q
```

Authorize the CI deploy key for the `deploy` user (the public half of the key
whose private half is stored as `DEPLOY_SSH_KEY` in GitHub):

```bash
# On the server, as the deploy user:
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAA...ci-deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
# Capture the pinned host key for DEPLOY_KNOWN_HOSTS:
ssh-keyscan -t ed25519 "$(tailscale ip -4)" 2>/dev/null
```

---

## 4. GitHub repository configuration

**Settings → Environments → New environment `production`** — enable *Required
reviewers* so deploys need approval.

**Secrets:**

| Name | Value |
| --- | --- |
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client id |
| `TS_OAUTH_SECRET` | Tailscale OAuth client secret |
| `DEPLOY_SSH_KEY` | Private ed25519 key for the `deploy` user |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 <tailnet-ip>` |

**Variables:**

| Name | Example |
| --- | --- |
| `DEPLOY_HOST` | `iot-server` (MagicDNS name) or `100.x.y.z` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/srv/appdata/compose/iot-monitoring` |
| `PUBLIC_HOSTNAME` | `iot.example.com` |

The Tailscale OAuth client needs a tag (e.g. `tag:ci`) and an ACL allowing that
tag to reach the server on port 22. Keep it limited to that.

---

## 5. First deployment

Images are produced by `.github/workflows/publish.yml` (on a `v*` tag or manual
dispatch). Then either:

**Automated:** push a tag → publish runs → deploy workflow picks the tag up
(after environment approval).

**Manual on the server:**

```bash
cd /srv/appdata/compose/iot-monitoring
git fetch --tags
git checkout --detach v1.0.0
./deploy/deploy.sh v1.0.0
```

`deploy.sh` will:

1. verify Compose ≥ 2.24 and validate the rendered config;
2. create `/srv/appdata/iot-monitoring/*` with correct ownership;
3. pull the pinned images;
4. `docker compose up -d --no-build`;
5. wait until every container is `healthy` and `http://127.0.0.1:5173/` and
   `/api` return 200;
6. on failure, automatically roll back to the previously deployed tag.

The first start seeds an empty PostgreSQL data directory from
`database/init.sql` and creates the seed admin user from `SEED_ADMIN_*` in
`deploy/.env`. **Change that password after the first login.**

### Database migrations

`database/init.sql` runs only when `PGDATA` is empty. Additional migrations in
`database/migrations/` are applied manually:

```bash
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml exec -T postgres \
  psql -U iot_user -d iot_monitoring -f /docker-entrypoint-initdb.d/../migrations/001_add_users.sql
```

Because `database/` is not mounted into the container in production (only
`init.sql` is, read-only, at `/docker-entrypoint-initdb.d/`), apply migrations by
piping the file in instead:

```bash
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml exec -T postgres \
  psql -U iot_user -d iot_monitoring < database/migrations/001_add_users.sql
```

Take a backup first (see §8). There is no migration runner, so apply them in
order and verify each one.

---

## 6. Routine deploys and rollback

```bash
# Deploy a specific tag
./deploy/deploy.sh v1.0.1

# Roll back to the tag that was deployed before the current one
./deploy/deploy.sh --rollback-previous
```

`deploy/.deployed` records the current tag and image digests. Rollback is
automatic on failed health checks and is available in CI as the `rollback`
input of the deploy workflow.

Deploys never run `docker compose down` and never delete volumes, so data is
untouched by a failed release.

---

## 7. Administrative access (private services)

Grafana, Node-RED, Adminer and PostgreSQL are not publicly routable. Three ways
to reach them, in increasing convenience:

**a) SSH port-forward (recommended default):**

```bash
# From your workstation, over the tailnet:
ssh -N \
  -L 3001:127.0.0.1:3001 \
  -L 1880:127.0.0.1:1880 \
  -L 8080:127.0.0.1:8080 \
  deploy@iot-server
```

Then, in another terminal (after enabling the admin overlay, see below):
Grafana → `http://localhost:3001`, Node-RED → `http://localhost:1880/admin`,
Adminer → `http://localhost:8080`.

**b) Tailnet binding via `compose.admin.yaml`:**

```bash
cd /srv/appdata/compose/iot-monitoring
# requires TAILSCALE_IP in deploy/.env
docker compose --env-file deploy/.env \
  -f compose.yaml -f compose.production.yaml -f compose.admin.yaml \
  --profile tools up -d
# ...do the work...
# return to the normal, fully private state:
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml up -d
```

**c) Node-RED dashboard** (`http://<tailnet-ip>:1880/ui/`) for read-only views.

Node-RED's editor is protected by `adminAuth`; its password hash and credential
secret come from `deploy/.env` (`NODE_RED_ADMIN_PASSWORD_HASH`,
`NODE_RED_CREDENTIAL_SECRET`). Grafana uses `GRAFANA_ADMIN_*`.

---

## 8. Backup and restore

```bash
./deploy/backup.sh                 # db dump + Node-RED data + Grafana state
BACKUP_DIR=/mnt/backups ./deploy/backup.sh
```

Backups land in `/srv/appdata/iot-monitoring/backups` and are pruned after
`BACKUP_RETENTION_DAYS` (default 14). The dump is verified (gzip integrity +
non-trivial size). Copy backups off the server periodically.

**Restore the database:**

```bash
# Stop writers first so nothing is half-restored
docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml stop backend nodered

gunzip -c /srv/appdata/iot-monitoring/backups/postgres-YYYYmmdd-HHMMSS.sql.gz \
  | docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml \
      exec -T postgres psql -U iot_user -d iot_monitoring

docker compose --env-file deploy/.env -f compose.yaml -f compose.production.yaml start backend nodered
```

Restoring Node-RED/Grafana is a matter of extracting the corresponding tarball
over the same `/srv/appdata/iot-monitoring/<service>` directory while the
container is stopped.

---

## 9. Secrets handling

- Real values live only in `deploy/.env` (mode 600, gitignored). Nothing
  sensitive is committed: Node-RED reads the database password, API key and
  editor credentials from the environment, and Grafana's datasource password is
  interpolated from `$POSTGRES_PASSWORD` at startup.
- **Compose interpolates `$` in env files.** A bcrypt hash in `deploy/.env` must
  have every `$` doubled (`$$2a$$10$$...`). `generate-env.sh` writes the escaped
  form; if you edit the hash by hand, escape it yourself.
- Never print or paste secret values into logs, issues or chat. `deploy/*.sh`
  are written not to echo them.
- Rotate: `JWT_SECRET`/`JWT_REFRESH_SECRET` invalidate existing sessions;
  `INGEST_API_KEY` must be updated for both backend and Node-RED (they share the
  same `.env`, so a single `up -d` applies it); `POSTGRES_PASSWORD` requires a
  coordinated `ALTER USER` + `.env` update + recreate.
- Use `deploy/generate-env.sh --force` only when intentionally rotating
  everything, as it rewrites the whole file.

---

## 10. Troubleshooting

| Symptom | Check |
| --- | --- |
| `compose config` fails "set GRAFANA_ADMIN_PASSWORD" / "POSTGRES_PASSWORD is required" | `deploy/.env` missing a required value. |
| `docker compose pull` denied | Server not logged in to GHCR, or the tag was never published. |
| Container healthy but site 502/blank | `docker compose logs frontend backend`; confirm the backend is healthy (`/health`) and nginx can reach `backend:3000`. |
| Node-RED cannot insert rows | `docker compose exec nodered env \| grep POSTGRES_`; check the flow's debug tab. |
| Node-RED discovery request 401 | `INGEST_API_KEY` differs between containers (should be impossible: shared `.env`). |
| Grafana datasource errors | `docker compose logs grafana`; confirm `POSTGRES_*` is present and the provisioning file uses `$VAR` names. |
| Deploy rolled back unexpectedly | `docker compose ps` + container logs at the failed tag; the previous tag is still running. |
| Admin UI "connection refused" over the tunnel | Expected: admin services are not routed publicly. Use §7. |

---

## 11. Security posture (summary)

- Public surface is exactly one hostname → nginx → SPA + `/api` proxy.
- No database, cache, admin or dashboard ports are published in production; a
  single loopback port feeds the Cloudflare Tunnel.
- Admin UIs are bound to the tailnet or reached over SSH forwarding only.
- Node-RED editor requires `adminAuth`; credentials are env-provided, secrets
  are not committed, and `credentialSecret` is set.
- Images are built in CI from locked dependencies (`npm ci`), tagged
  immutably, and deployed with `--no-build`.
- Containers run with `no-new-privileges`, capped log sizes, and restart
  policies; state is confined to `/srv/appdata/iot-monitoring`.
- TLS is terminated by Cloudflare; the origin is loopback-only, so no
  additional origin certificate management is required.

### Known limitations / future work

- No automated database migration runner (migrations are manual).
- No automated test suite yet; CI enforces lint + type-check + build + image
  build.
- Backups are local; off-site replication is out of scope.
- Grafana dashboards are hidden in the public UI by design; viewing them
  requires private access (§7).
- The seed admin password is a first-login credential only; rotate it in the
  app after first use.
