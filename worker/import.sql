-- Import collection from BGG export
-- Generated from collection_simplified.csv

-- Clear existing games (optional - remove these lines to keep existing data)
DELETE FROM plays;
DELETE FROM games;

-- Insert base games first (standalone)
-- Using bgg_id as the unique identifier, id will auto-increment
INSERT INTO games (bgg_id, name, is_expansion, parent_game_id) VALUES
(173346, '7 Wonders Duel', 0, NULL),
(295947, 'Cascadia', 0, NULL),
(266507, 'Clank! Legacy: Acquisitions Incorporated', 0, NULL),
(198773, 'Codenames: Pictures', 0, NULL),
(39463, 'Cosmic Encounter', 0, NULL),
(324856, 'The Crew: Mission Deep Sea', 0, NULL),
(521, 'Crokinole', 0, NULL),
(373600, 'Cthulhu: Death May Die – Fear of the Unknown', 0, NULL),
(334986, 'Daybreak', 0, NULL),
(156129, 'Deception: Murder in Hong Kong', 0, NULL),
(225694, 'Decrypto', 0, NULL),
(397598, 'Dune: Imperium – Uprising', 0, NULL),
(420087, 'Flip 7', 0, NULL),
(221965, 'The Fox in the Forest', 0, NULL),
(93, 'El Grande', 0, NULL),
(220, 'High Society', 0, NULL),
(155821, 'Inis', 0, NULL),
(369258, 'Isle of Skye: Big Box', 0, NULL),
(254640, 'Just One', 0, NULL),
(356033, 'Libertalia: Winds of Galecrest', 0, NULL),
(12942, 'No Thanks!', 0, NULL),
(194879, 'Not Alone', 0, NULL),
(161936, 'Pandemic Legacy: Season 1', 0, NULL),
(244521, 'Quacks: Deluxe Edition', 0, NULL),
(217372, 'The Quest for El Dorado', 0, NULL),
(12, 'Ra', 0, NULL),
(367220, 'Sea Salt & Paper', 0, NULL),
(92415, 'Skull', 0, NULL),
(373106, 'Sky Team', 0, NULL),
(329839, 'So Clover!', 0, NULL),
(408547, 'Things in Rings', 0, NULL),
(274364, 'Watergate', 0, NULL),
(262543, 'Wavelength', 0, NULL),
(266192, 'Wingspan', 0, NULL);

-- Insert expansions (with parent references)
-- parent_game_id must reference the auto-generated id, not bgg_id
-- We need to look up the parent's id first
INSERT INTO games (bgg_id, name, is_expansion, parent_game_id) VALUES
(202976, '7 Wonders Duel: Pantheon', 1, (SELECT id FROM games WHERE bgg_id = 173346)),
(153971, 'Cosmic Encounter: Cosmic Dominion', 1, (SELECT id FROM games WHERE bgg_id = 39463)),
(61001, 'Cosmic Encounter: Cosmic Incursion', 1, (SELECT id FROM games WHERE bgg_id = 39463)),
(366161, 'Wingspan Asia', 1, (SELECT id FROM games WHERE bgg_id = 266192)),
(290448, 'Wingspan: European Expansion', 1, (SELECT id FROM games WHERE bgg_id = 266192)),
(300580, 'Wingspan: Oceania Expansion', 1, (SELECT id FROM games WHERE bgg_id = 266192));
