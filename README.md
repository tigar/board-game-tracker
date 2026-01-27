# Board Game Tracker

A simple, mobile-first app to quickly log your board game plays.

## Features

- Log plays with game name, date, player count, and win/loss
- Search and filter your play history
- View basic stats (total plays, wins, losses)
- Auto-create games as you log plays
- Clean, modern mobile UI

## Stack

- **Frontend**: SvelteKit (static site)
- **Backend**: Cloudflare Workers + D1 (SQLite)

## Development

```bash
# Frontend (localhost:5173)
yarn dev

# Backend (localhost:8787)
cd worker && yarn dev
```

## Deployment

- Frontend: Deploy static site to GitHub Pages or Cloudflare Pages
- Backend: Deploy worker to Cloudflare

```bash
# Deploy backend
cd worker
wrangler deploy

# Build frontend
yarn build
```

## License

MIT
