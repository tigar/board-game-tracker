# Board Game Tracker

A simple, mobile-first app to quickly log your board game plays.

## Features

- Log plays with game name, date, player count, and placement
- Track competitive games (1st, 2nd, 3rd place...) or co-op games (won/lost)
- Search and filter your play history
- View basic stats (total plays, wins, losses)
- Auto-create games as you log plays
- Support for game expansions
- Clean, modern mobile UI with Tailwind CSS

## Stack

- **Frontend**: Vanilla JS + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers + KV (key-value store)

## Development

```bash
# Install dependencies
yarn install

# Frontend (localhost:5173)
yarn dev

# Backend (localhost:8787)
cd worker && yarn dev
```

## Deployment

### Backend (Cloudflare Worker)

1. Create a KV namespace in your Cloudflare dashboard
2. Update `worker/wrangler.toml` with your KV namespace ID
3. Deploy:

```bash
cd worker
yarn wrangler deploy
```

### Frontend

Build and deploy to any static hosting (GitHub Pages, Cloudflare Pages, Vercel, etc.):

```bash
yarn build
# Output is in dist/
```

Set `VITE_API_URL` environment variable to your Worker URL during build.

## Data Model

### Game
- `id` - UUID
- `name` - Game name
- `is_expansion` - Boolean
- `parent_game_id` - For expansions
- `co_op` - Is this a cooperative game?
- `created_at` - ISO timestamp

### Play
- `id` - UUID
- `game_id` - Reference to game
- `date_played` - Date of play
- `place` - Placement (1st, 2nd, etc.) or for co-op: 1=won, -1=lost
- `number_of_players` - Player count
- `expansion_ids` - Array of expansion IDs used
- `notes` - Optional notes
- `duration_minutes` - Optional duration
- `created_at`, `updated_at` - Timestamps


## TODOs
- [ ] Add separate "log game outside of collection" button
- [ ] Improve stats tracking
- [ ] Redo color scheme and component styling
- [ ] Set-up demo endpoint
- [ ] Configure OAuth for actual deployment with "view only" endpoint

## License

MIT
