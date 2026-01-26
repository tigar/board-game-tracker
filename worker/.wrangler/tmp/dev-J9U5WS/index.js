var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-GHwfS4/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-GHwfS4/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/bgg.ts
function parseCSV(csvText) {
  const lines = csvText.split("\n");
  if (lines.length === 0)
    return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line)
      continue;
    const values = parseCSVLine(line);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }
  return rows;
}
__name(parseCSV, "parseCSV");
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
__name(parseCSVLine, "parseCSVLine");
function parseCollectionCSV(csvText) {
  const rows = parseCSV(csvText);
  const games = [];
  for (const row of rows) {
    if (!row.objectid || !row.objectname)
      continue;
    const bggId = Number.parseInt(row.objectid, 10);
    if (Number.isNaN(bggId))
      continue;
    const userRating = Number.parseFloat(row.rating);
    const bggRating = Number.parseFloat(row.average);
    const complexity = Number.parseFloat(row.avgweight);
    const rank = Number.parseInt(row.rank, 10);
    const minPlayers = Number.parseInt(row.minplayers, 10);
    const maxPlayers = Number.parseInt(row.maxplayers, 10);
    const playingTime = Number.parseInt(row.playingtime, 10);
    const yearPublished = Number.parseInt(row.yearpublished, 10);
    const game = {
      bgg_id: bggId,
      name: row.objectname,
      min_players: Number.isNaN(minPlayers) ? void 0 : minPlayers,
      max_players: Number.isNaN(maxPlayers) ? void 0 : maxPlayers,
      playing_time: Number.isNaN(playingTime) ? void 0 : playingTime,
      year_published: Number.isNaN(yearPublished) ? void 0 : yearPublished,
      user_rating: Number.isNaN(userRating) || userRating === 0 ? void 0 : userRating,
      bgg_rating: Number.isNaN(bggRating) ? void 0 : bggRating,
      complexity: Number.isNaN(complexity) || complexity === 0 ? void 0 : complexity,
      bgg_rank: Number.isNaN(rank) || rank === 0 ? void 0 : rank,
      item_type: row.itemtype === "expansion" ? "expansion" : "standalone",
      recommended_players: row.bggrecplayers || void 0,
      best_players: row.bggbestplayers || void 0
    };
    if (row.imageid) {
      game.image_url = `https://cf.geekdo-images.com/images/pic${row.imageid}.jpg`;
      game.thumbnail_url = `https://cf.geekdo-images.com/images/pic${row.imageid}_t.jpg`;
    }
    games.push(game);
  }
  return games;
}
__name(parseCollectionCSV, "parseCollectionCSV");

// src/db.ts
async function getAllGames(db) {
  const result = await db.prepare("SELECT * FROM games ORDER BY name ASC").all();
  return result.results || [];
}
__name(getAllGames, "getAllGames");
async function getGameById(db, id) {
  const result = await db.prepare("SELECT * FROM games WHERE id = ?").bind(id).first();
  return result;
}
__name(getGameById, "getGameById");
async function getGameByBGGId(db, bggId) {
  const result = await db.prepare("SELECT * FROM games WHERE bgg_id = ?").bind(bggId).first();
  return result;
}
__name(getGameByBGGId, "getGameByBGGId");
async function createGame(db, game) {
  const result = await db.prepare(
    `INSERT INTO games (bgg_id, name, image_url, thumbnail_url, min_players, max_players, playing_time, year_published, description, user_rating, bgg_rating, complexity, bgg_rank, item_type, recommended_players, best_players)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    game.bgg_id,
    game.name,
    game.image_url || null,
    game.thumbnail_url || null,
    game.min_players || null,
    game.max_players || null,
    game.playing_time || null,
    game.year_published || null,
    game.description || null,
    game.user_rating || null,
    game.bgg_rating || null,
    game.complexity || null,
    game.bgg_rank || null,
    game.item_type || "standalone",
    game.recommended_players || null,
    game.best_players || null
  ).run();
  return result.meta.last_row_id;
}
__name(createGame, "createGame");
async function updateGame(db, id, game) {
  await db.prepare(
    `UPDATE games SET
				name = COALESCE(?, name),
				image_url = COALESCE(?, image_url),
				thumbnail_url = COALESCE(?, thumbnail_url),
				min_players = COALESCE(?, min_players),
				max_players = COALESCE(?, max_players),
				playing_time = COALESCE(?, playing_time),
				year_published = COALESCE(?, year_published),
				description = COALESCE(?, description),
				user_rating = COALESCE(?, user_rating),
				bgg_rating = COALESCE(?, bgg_rating),
				complexity = COALESCE(?, complexity),
				bgg_rank = COALESCE(?, bgg_rank),
				item_type = COALESCE(?, item_type),
				recommended_players = COALESCE(?, recommended_players),
				best_players = COALESCE(?, best_players),
				last_synced_at = CURRENT_TIMESTAMP
			WHERE id = ?`
  ).bind(
    game.name || null,
    game.image_url || null,
    game.thumbnail_url || null,
    game.min_players || null,
    game.max_players || null,
    game.playing_time || null,
    game.year_published || null,
    game.description || null,
    game.user_rating || null,
    game.bgg_rating || null,
    game.complexity || null,
    game.bgg_rank || null,
    game.item_type || null,
    game.recommended_players || null,
    game.best_players || null,
    id
  ).run();
}
__name(updateGame, "updateGame");
async function deleteGame(db, id) {
  await db.prepare("DELETE FROM games WHERE id = ?").bind(id).run();
}
__name(deleteGame, "deleteGame");
async function getAllPlays(db, gameId) {
  let query = `
		SELECT plays.*, games.name as game_name
		FROM plays
		JOIN games ON plays.game_id = games.id
	`;
  if (gameId) {
    query += " WHERE plays.game_id = ?";
    const result2 = await db.prepare(`${query} ORDER BY plays.played_at DESC`).bind(gameId).all();
    return result2.results || [];
  }
  const result = await db.prepare(`${query} ORDER BY plays.played_at DESC`).all();
  return result.results || [];
}
__name(getAllPlays, "getAllPlays");
async function getPlayById(db, id) {
  const result = await db.prepare("SELECT * FROM plays WHERE id = ?").bind(id).first();
  return result;
}
__name(getPlayById, "getPlayById");
async function createPlay(db, play) {
  const result = await db.prepare(
    `INSERT INTO plays (game_id, played_at, won, player_count, notes, duration_minutes)
			VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    play.game_id,
    play.played_at,
    play.won !== void 0 ? play.won ? 1 : 0 : null,
    play.player_count,
    play.notes || null,
    play.duration_minutes || null
  ).run();
  return result.meta.last_row_id;
}
__name(createPlay, "createPlay");
async function updatePlay(db, id, play) {
  await db.prepare(
    `UPDATE plays SET
				played_at = COALESCE(?, played_at),
				won = COALESCE(?, won),
				player_count = COALESCE(?, player_count),
				notes = COALESCE(?, notes),
				duration_minutes = COALESCE(?, duration_minutes)
			WHERE id = ?`
  ).bind(
    play.played_at || null,
    play.won !== void 0 ? play.won ? 1 : 0 : null,
    play.player_count || null,
    play.notes || null,
    play.duration_minutes || null,
    id
  ).run();
}
__name(updatePlay, "updatePlay");
async function deletePlay(db, id) {
  await db.prepare("DELETE FROM plays WHERE id = ?").bind(id).run();
}
__name(deletePlay, "deletePlay");
async function upsertSyncMetadata(db, deviceId, tableName) {
  await db.prepare(
    `INSERT INTO sync_metadata (device_id, table_name, last_sync)
			VALUES (?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT(device_id, table_name) DO UPDATE SET last_sync = CURRENT_TIMESTAMP`
  ).bind(deviceId, tableName).run();
}
__name(upsertSyncMetadata, "upsertSyncMetadata");
async function getPlayStats(db) {
  const result = await db.prepare(
    `SELECT
				COUNT(*) as total_plays,
				COUNT(DISTINCT game_id) as total_games_played,
				SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as total_wins,
				SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) as total_losses
			FROM plays`
  ).first();
  return result || {
    total_plays: 0,
    total_games_played: 0,
    total_wins: 0,
    total_losses: 0
  };
}
__name(getPlayStats, "getPlayStats");

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function handleOptions() {
  return new Response(null, {
    headers: corsHeaders
  });
}
__name(handleOptions, "handleOptions");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return handleOptions();
    }
    if (path === "/health") {
      return jsonResponse({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (path === "/api/collection/import" && request.method === "POST") {
      try {
        const csvText = await request.text();
        if (!csvText.trim()) {
          return errorResponse("CSV data is required");
        }
        const games = parseCollectionCSV(csvText);
        if (games.length === 0) {
          return errorResponse("No valid games found in CSV");
        }
        let imported = 0;
        let updated = 0;
        for (const game of games) {
          const existing = await getGameByBGGId(env.DB, game.bgg_id);
          if (existing) {
            await updateGame(env.DB, existing.id, game);
            updated++;
          } else {
            await createGame(env.DB, game);
            imported++;
          }
        }
        return jsonResponse({ imported, updated, total: games.length });
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : "Failed to import collection",
          500
        );
      }
    }
    try {
      if (path === "/api/games" && request.method === "GET") {
        const games = await getAllGames(env.DB);
        return jsonResponse(games);
      }
      if (path.startsWith("/api/games/") && request.method === "GET") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        const game = await getGameById(env.DB, id);
        if (!game) {
          return errorResponse("Game not found", 404);
        }
        return jsonResponse(game);
      }
      if (path === "/api/games" && request.method === "POST") {
        const game = await request.json();
        const id = await createGame(env.DB, game);
        return jsonResponse({ id }, 201);
      }
      if (path.startsWith("/api/games/") && request.method === "PUT") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        const game = await request.json();
        await updateGame(env.DB, id, game);
        return jsonResponse({ success: true });
      }
      if (path.startsWith("/api/games/") && request.method === "DELETE") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        await deleteGame(env.DB, id);
        return jsonResponse({ success: true });
      }
      if (path === "/api/plays" && request.method === "GET") {
        const gameId = url.searchParams.get("game_id");
        const plays = await getAllPlays(
          env.DB,
          gameId ? Number.parseInt(gameId, 10) : void 0
        );
        return jsonResponse(plays);
      }
      if (path.startsWith("/api/plays/") && request.method === "GET") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        const play = await getPlayById(env.DB, id);
        if (!play) {
          return errorResponse("Play not found", 404);
        }
        return jsonResponse(play);
      }
      if (path === "/api/plays" && request.method === "POST") {
        const play = await request.json();
        const id = await createPlay(env.DB, play);
        return jsonResponse({ id }, 201);
      }
      if (path.startsWith("/api/plays/") && request.method === "PUT") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        const play = await request.json();
        await updatePlay(env.DB, id, play);
        return jsonResponse({ success: true });
      }
      if (path.startsWith("/api/plays/") && request.method === "DELETE") {
        const id = Number.parseInt(path.split("/").pop() || "0", 10);
        await deletePlay(env.DB, id);
        return jsonResponse({ success: true });
      }
      if (path === "/api/stats" && request.method === "GET") {
        const stats = await getPlayStats(env.DB);
        return jsonResponse(stats);
      }
      if (path === "/api/sync" && request.method === "POST") {
        const { device_id, table_name } = await request.json();
        await upsertSyncMetadata(env.DB, device_id, table_name);
        return jsonResponse({ success: true });
      }
      return errorResponse("Not found", 404);
    } catch (error) {
      console.error("Worker error:", error);
      return errorResponse(error instanceof Error ? error.message : "Internal server error", 500);
    }
  }
};

// .yarn/__virtual__/wrangler-virtual-0e0b4e9fdb/3/.yarn/berry/cache/wrangler-npm-3.114.17-3a5dac59d4-10c0.zip/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .yarn/__virtual__/wrangler-virtual-0e0b4e9fdb/3/.yarn/berry/cache/wrangler-npm-3.114.17-3a5dac59d4-10c0.zip/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-GHwfS4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// .yarn/__virtual__/wrangler-virtual-0e0b4e9fdb/3/.yarn/berry/cache/wrangler-npm-3.114.17-3a5dac59d4-10c0.zip/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-GHwfS4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
