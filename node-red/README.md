# Node-RED IoT Data Simulation

Node-RED flow that simulates temperature/humidity sensor data for the IoT
Monitoring System. It discovers active sensors through the backend API and
inserts generated readings directly into PostgreSQL.

## Overview

Two flows run in one tab:

1. **Initialization** — once on start (5 s delay): `GET /api/sensors/active`,
   stores the sensors in global context.
2. **Data Simulation** — every 60 s: generates a realistic value per sensor
   (smooth transitions inside min/max bounds) and inserts it into
   `sensor_logs`. Debug output is on the sidebar.

## Credentials and secrets (no hardcoded values)

Nothing sensitive is committed. Both the database connection and the backend
API key are resolved from environment variables at runtime.

- **PostgreSQL config node** (`postgreSQLConfig`, "IoT Database") uses the
  `env` type for `host`, `database`, `user` and `password`:
  `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
  `node-red-contrib-postgresql` resolves these with `process.env[...]` at
  deploy time, so no password appears in `flows.json`.
- **Sensor discovery request** ("Add X-API-Key Header" change node) sets
  `msg.headers["X-API-Key"] = $(INGEST_API_KEY)` before the HTTP request,
  matching the backend's `requireApiKey` guard. If `INGEST_API_KEY` is empty
  on the backend, the header is ignored (guard is a no-op).
- **Editor auth** (`settings.js`) requires `NODE_RED_ADMIN_PASSWORD_HASH`
  (bcrypt) and `NODE_RED_ADMIN_USER`; `credentialSecret` comes from
  `NODE_RED_CREDENTIAL_SECRET`. The editor is only reachable over the private
  network (Tailscale / SSH port-forward) — never through Cloudflare.

The same root `.env` feeds the backend and Node-RED (see `compose.yaml`), so
`POSTGRES_*` and `INGEST_API_KEY` can never drift between them.

## Persistence / bootstrap

`/data` is a persistent volume or bind mount. On startup,
`entrypoint.sh` seeds `settings.js` and `flows.json` from
`/opt/node-red-bootstrap` **only when they are missing**, so it:

- makes a fresh bind-mounted server work out of the box, and
- never overwrites flows you edited in the editor.

To ship a flow change to an existing instance, either edit+deploy in the
editor, or remove `flows.json` from the data directory before redeploying.

## Configuration

| Setting | Value |
| --- | --- |
| Editor root | `/admin` (auth required) |
| Dashboard UI | `/ui` |
| Init delay | 5 s |
| Simulation interval | 60 s (inject node `repeat`) |
| Context | memory + localfilesystem |

## Pinned dependencies

Dependencies are installed with `npm ci` from the committed
`package-lock.json`:

- `node-red-contrib-postgresql@0.16.2`
- `node-red-dashboard@3.6.6`

The base image is pinned to `nodered/node-red:5.0.8`. To upgrade, bump the tag
deliberately, rebuild, and re-verify inserts in a staging stack.

## Interfaces (private only)

- Flow editor: `http://127.0.0.1:1880/admin` (via SSH port-forward or tailnet)
- Dashboard: `http://127.0.0.1:1880/ui/`
- Health endpoint used by Docker: `GET /ui/`

None of these ports are published to the host in production.

## Files

```
node-red/
├── package.json            # pinned palette dependencies
├── package-lock.json       # reproducible install (npm ci)
├── settings.js             # runtime config; auth from environment
├── flows.json              # flow definitions; credentials from environment
├── entrypoint.sh           # seeds /data on first start, then starts Node-RED
├── Dockerfile
└── README.md
```

## Troubleshooting

- **No data generated** — check the initialization flow loaded sensors
  (sidebar debug). Confirm `is_active = true` sensors exist.
- **Database errors** — verify `POSTGRES_*` env vars are present in the
  container (`docker compose exec nodered env | grep POSTGRES_`).
- **401 from backend** — the `INGEST_API_KEY` value differs between the
  backend and Node-RED containers; both come from the root `.env`.
- **Editor login fails** — `NODE_RED_ADMIN_PASSWORD_HASH` is missing or is not
  a valid bcrypt hash; regenerate it with `deploy/generate-env.sh`.

## License

Part of the IoT Monitoring System project.
