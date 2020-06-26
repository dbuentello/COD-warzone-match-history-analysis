require('dotenv').config();
const _ = require('lodash');
const config = require('./config.js');
const fs = require('fs').promises;
const api = require('./helpers/api');
const MatchClass = require('./classes/Match');
const MatchInfoClass = require('./classes/MatchInfo');
const PlayerClass = require('./classes/Player');
const PlayerInfoClass = require('./classes/PlayerInfo');
const { default: PQueue } = require('p-queue');
const log = require('./helpers/log');
const mainLogger = log.mainLogger;

const playerToSearch = { username: config.username, platform: config.platform };

const main = async () => {
	if (playerToSearch.username === '' || playerToSearch === undefined || playerToSearch === null) {
		mainLogger.error(`Invalid username in 'config.js'.`);
		process.stdin.once('', process.exit(1));
	}

	if (!['battle', 'psn', 'uno', 'xbl'].includes(playerToSearch.platform)) {
		mainLogger.error(`Invalid platform in 'config.js'.`);
		process.stdin.once('', process.exit(1));
	}

	const rawMatches = await api.fetchMatchesForPlayer(playerToSearch);
	const matchesInfo = await parseMatchesInfo(rawMatches);

	if (config.matchId === '' || config.matchId === undefined || config.matchId === null) {
		await fetchMatches(matchesInfo, 5, true);
	}
	else {
		const filteredMatch = matchesInfo.filter(m => m.id == config.matchId)[0];
		await fetchMatches([filteredMatch], 1, true);
	}
};

main();

/**
 * Parses raw data from the api to more readable and useable data.
 * @param rawMatches The matches straight from the api.
 * @returns An array of matches cleaned up into MatchInfo objects.
 */
const parseMatchesInfo = async (rawMatches) => {
	if (rawMatches === undefined || rawMatches === null) {
		return null;
	}

	const matchesInfo = [];

	for (const rawMatch of rawMatches) {
		mainLogger.info(`Parsing info for match with id '${rawMatch.matchID}'.`);

		const playersInfoToFollow = [];
		const otherPlayersInfo = [];

		try {
			for (const rankedTeam of rawMatch.rankedTeams) {
				for (const player of rankedTeam.players) {
					const filteredPlayer = new PlayerInfoClass(player);
	
					if (player.team == rawMatch.player.team) { playersInfoToFollow.push(filteredPlayer); }
					else {
						otherPlayersInfo.push(filteredPlayer);
					}
				}
			}
		} catch (error) {
			mainLogger.error(`Error while parsing raw matches: ${error}`);
			process.stdin.once('', process.exit(1));
		}

		mainLogger.info(`Parsed info for match with id '${rawMatch.matchID}'.`);

		matchesInfo.push(new MatchInfoClass(rawMatch, playersInfoToFollow, otherPlayersInfo));
	}

	return matchesInfo;
};

/**
 * Fetches matches from the api using the matchesInfo.
 * @param matchesInfo Cleaned up array of objects containing the necessary information to fetch all users from it.
 * @param stopAfter Amount of matches to fetch until stopping.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user down the line by fuzzy searching and comparing match history.
 * @returns A player object with some player information and statistics or null.
 */
const fetchMatches = async (matchesInfo, stopAfter, strict) => {
	if (matchesInfo === undefined || matchesInfo === null) {
		return null;
	}

	let count = 0;

	for (const matchInfo of matchesInfo) {
		const match = await fetchPlayersFromMatch(matchInfo, strict);
		await fs.writeFile(`Analysis of match with id ${match.id} following ${playerToSearch.username} on ${playerToSearch.platform}.json`, JSON.stringify(match));

		count++;

		if (stopAfter === count) {
			return;
		}
	}
};

/**
 * Fetches all players it can find from a matchInfo object.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user by fuzzy searching and comparing match history.
 * @returns A match object with some match information, statistics, and all players found in that match from the api.
 */
const fetchPlayersFromMatch = async (matchInfo, strict) => {
	if (matchInfo === undefined || matchInfo === null) {
		return null;
	}

	const playersToFollow = [];
	const otherPlayers = [];

	mainLogger.info(`Fetching players from match with id '${matchInfo.id}'.`);

	const playerFetchQueue = new PQueue({ concurrency: 3, timeout: 1800000 });

	for (const playerInfo of matchInfo.playersInfoToFollow) {
		playerFetchQueue.add(async () => await fetchPlayerFromApi(playerInfo, matchInfo, strict).then((player) => {
			if (player !== null) {
				playersToFollow.push(player);
			}
		}));
	}

	for (const playerInfo of matchInfo.otherPlayersInfo) {
		playerFetchQueue.add(async () => await fetchPlayerFromApi(playerInfo, matchInfo, strict).then((player) => {
			if (player !== null) {
				otherPlayers.push(player);
			}
		}));
	}

	await playerFetchQueue.onIdle();

	mainLogger.info(`Fetched ${playersToFollow.length + otherPlayers.length} players from match with id '${matchInfo.id}'.`);

	return new MatchClass(matchInfo, playersToFollow, otherPlayers);
};

/**
 * Fetches a player from the the api with given information from a match. If told to applies fuzzy searching to ensure the correct player is fetched.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user by fuzzy searching and comparing match history.
 * @returns A player object with some player information and statistics or null.
 */
const fetchPlayerFromApi = async (playerInfo, matchInfo, strict) => {
	if (playerInfo === undefined || playerInfo === null || matchInfo === undefined || matchInfo === null) {
		return null;
	}

	const fuzzySearchResult = await api.fuzzySearchUsername(playerInfo.username);

	if (fuzzySearchResult === undefined) {
		return null;
	}

	const filteredSearchResult = (playerInfo.platform == 'battle') ? fuzzySearchResult.filter(r => r.platform == 'battle' || r.platform == 'uno') : fuzzySearchResult.filter(r => r.platform == playerInfo.platform || r.platform == 'uno');

	for (const potentialPlayerInfo of filteredSearchResult) {
		const player = (strict) ? await verifyThatPlayerWasInMatch(new PlayerInfoClass(potentialPlayerInfo), playerInfo, matchInfo) : await api.fetchPlayer(new PlayerInfoClass(potentialPlayerInfo));

		if (player !== null) {
			mainLogger.info(`Player '${potentialPlayerInfo.username}' was found in match '${matchInfo.id}' on '${potentialPlayerInfo.platform}'.`);
			player.updateInfo(playerInfo, true);
			return player;
		}

	}

	mainLogger.warn(`Couldn't find player '${playerInfo.username}' on any platform.`);
	const player = new PlayerClass(playerInfo, null);
	player.updateInfo(playerInfo, false);
	return player;
};

/**
 * Checks if a player was found inside of a match by comparing the match id's.
 * @param potentialPlayerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @returns A player object with some player information and statistics or null.
 */
const verifyThatPlayerWasInMatch = async (potentialPlayerInfo, matchInfo) => {
	if (potentialPlayerInfo === undefined || potentialPlayerInfo === null || matchInfo === undefined || matchInfo === null) {
		return null;
	}

	const player = await api.fetchPlayer(potentialPlayerInfo);

	if (player !== null) {
		const playerMatches = await api.fetchMatchesForPlayer(potentialPlayerInfo);

		if (playerMatches.length > 0) {
			const match = _.find(playerMatches, { 'matchID': matchInfo.id });

			if (match !== undefined) {
				return player;
			}
		}
	}

	return null;
};