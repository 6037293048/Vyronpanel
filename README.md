# Vyron Server Panel

Vyron is a clean Minecraft hosting panel prototype where you can:

- Add multiple Minecraft server entries
- Pick loader and Minecraft version from dropdown menus
- Start, stop, and restart servers from one dashboard
- Edit and delete server configurations
- Track status, RAM allocation, and online player counts
- Install addons, create schedules, and configure webhooks

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:4170

## Project structure

- `public/` - frontend (UI + interactions)
- `server.js` - Express API and static hosting
- `data/servers.json` - persistent server data

## API routes

- `GET /api/servers`
- `POST /api/servers`
- `PATCH /api/servers/:id`
- `DELETE /api/servers/:id`
- `POST /api/servers/:id/action` (`start`, `stop`, `restart`, `crash`)
- `POST /api/servers/:id/addons/install-url`
- `POST /api/servers/:id/schedules`
- `POST /api/servers/:id/webhooks`
- `POST /api/agent/ping`
- `GET /installer.sh`
- `GET /download/installer.sh`

## Installer

- LAN URL example: `http://192.168.0.19:4170/installer.sh`
- Local dev URL: `http://localhost:4170/installer.sh`
- Full setup guide: `https://docs.vyronpanel.com`

## Authentication

- First launch requires creating a single admin user
- Later launches require login with that same user
- Auth uses an HTTP-only session cookie

## Notes

Lifecycle actions are simulated for game process control, but install/schedule/webhook data is persistent and webhook calls are dispatched on matching events.
