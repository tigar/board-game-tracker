# Board Game Tracker

Track your board game plays offline, sync to the cloud.

## What it does

- Import your BGG collection
- Log plays with win/loss and player count
- View stats across your collection
- Works offline, syncs when online

## Stack

- **Frontend**: SvelteKit + IndexedDB (Dexie)
- **Backend**: Cloudflare Workers + D1

## Dev

```bash
# Frontend (localhost:5173)
yarn start

# Worker (localhost:8787)
cd worker && yarn dev
```

## License

MIT
