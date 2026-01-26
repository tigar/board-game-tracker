import type { BGGCollectionRow, Game } from './types';

/**
 * Parse a CSV string into an array of objects
 */
function parseCSV(csvText: string): Record<string, string>[] {
	const lines = csvText.split('\n');
	if (lines.length === 0) return [];

	const headers = parseCSVLine(lines[0]);
	const rows: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values = parseCSVLine(line);
		const row: Record<string, string> = {};

		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = values[j] || '';
		}

		rows.push(row);
	}

	return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
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
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
}

/**
 * Parse BGG collection CSV data into Game objects
 */
export function parseCollectionCSV(csvText: string): Game[] {
	const rows = parseCSV(csvText) as unknown as BGGCollectionRow[];
	const games: Game[] = [];

	for (const row of rows) {
		if (!row.objectid || !row.objectname) continue;

		const bggId = Number.parseInt(row.objectid, 10);
		if (Number.isNaN(bggId)) continue;

		const userRating = Number.parseFloat(row.rating);
		const bggRating = Number.parseFloat(row.average);
		const complexity = Number.parseFloat(row.avgweight);
		const rank = Number.parseInt(row.rank, 10);
		const minPlayers = Number.parseInt(row.minplayers, 10);
		const maxPlayers = Number.parseInt(row.maxplayers, 10);
		const playingTime = Number.parseInt(row.playingtime, 10);
		const yearPublished = Number.parseInt(row.yearpublished, 10);

		const game: Game = {
			bgg_id: bggId,
			name: row.objectname,
			min_players: Number.isNaN(minPlayers) ? undefined : minPlayers,
			max_players: Number.isNaN(maxPlayers) ? undefined : maxPlayers,
			playing_time: Number.isNaN(playingTime) ? undefined : playingTime,
			year_published: Number.isNaN(yearPublished) ? undefined : yearPublished,
			user_rating: Number.isNaN(userRating) || userRating === 0 ? undefined : userRating,
			bgg_rating: Number.isNaN(bggRating) ? undefined : bggRating,
			complexity: Number.isNaN(complexity) || complexity === 0 ? undefined : complexity,
			bgg_rank: Number.isNaN(rank) || rank === 0 ? undefined : rank,
			item_type: row.itemtype === 'expansion' ? 'expansion' : 'standalone',
			recommended_players: row.bggrecplayers || undefined,
			best_players: row.bggbestplayers || undefined,
		};

		if (row.imageid) {
			game.image_url = `https://cf.geekdo-images.com/images/pic${row.imageid}.jpg`;
			game.thumbnail_url = `https://cf.geekdo-images.com/images/pic${row.imageid}_t.jpg`;
		}

		games.push(game);
	}

	return games;
}
