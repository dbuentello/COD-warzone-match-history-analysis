require('dotenv').config();
const _ = require('lodash');
const fs = require('fs');
const fsAsync = require('fs').promises;
const api = require('./helpers/api');
const MatchClass = require('./classes/Match');
const MatchInfoClass = require('./classes/MatchInfo');
const PlayerClass = require('./classes/Player');
const PlayerInfoClass = require('./classes/PlayerInfo');
const { default: PQueue } = require('p-queue');
const log = require('./helpers/log');
const mainLogger = log.mainLogger;

const main = async () => {
	const playerInfo = { username: 'Evexium#2747', platform: 'battle' };

	// const rawFile = fs.readFileSync(`insertfilenamehere.json`);
	// const jsonParse = JSON.parse(rawFile);

	const rawMatches = await api.fetchMatchesForPlayer(playerInfo);
	const matchesInfo = await parseMatchesInfo(rawMatches);

	if (matchesInfo.length > 0) {
		const filteredMatch = matchesInfo.filter(m => m.id == '18105369431075682534')[0];
		const matches = await fetchMatches([filteredMatch], true);
		await fsAsync.writeFile(`Analysis of match with id ${matches[0].id} following ${playerInfo.username} on ${playerInfo.platform}.json`, JSON.stringify(matches[0]));
	}
};

main();

/**
 * Parses raw data from the api to more readable and useable data.
 * @param rawMatches The matches straight from the api.
 * @returns An array of matches cleaned up into MatchInfo objects.
 */
const parseMatchesInfo = async (rawMatches) => {
	if (rawMatches === undefined) {
		return null;
	}

	const matchesInfo = [];

	for (const rawMatch of rawMatches) {
		mainLogger.info(`Parsing info for match with id '${rawMatch.matchID}'.`);

		const playersInfoToFollow = [];
		const otherPlayersInfo = [];

		for (const rankedTeam of rawMatch.rankedTeams) {
			for (const player of rankedTeam.players) {
				const filteredPlayer = new PlayerInfoClass(player);

				if (player.team == rawMatch.player.team) { playersInfoToFollow.push(filteredPlayer); }
				else {
					otherPlayersInfo.push(filteredPlayer);
				}
			}
		}

		mainLogger.info(`Parsed info for match with id '${rawMatch.matchID}'.`);

		matchesInfo.push(new MatchInfoClass(rawMatch, playersInfoToFollow, otherPlayersInfo));
	}

	return matchesInfo;
};

/**
 * Fetches matches from the api using the matchesInfo.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user down the line by fuzzy searching and comparing match history.
 * @returns A player object with some player information and statistics or null.
 */
const fetchMatches = async (matchesInfo, strict) => {
	const matches = [];

	for (const matchInfo of matchesInfo) {
		const match = await fetchPlayersFromMatch(matchInfo, strict);
		matches.push(match);
	}

	return matches;
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
	if (playerInfo == undefined || playerInfo == null) {
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
			mainLogger.info(`Player ${potentialPlayerInfo.username} was found in match '${matchInfo.id}' on '${potentialPlayerInfo.platform}'.`);
			return player;
		}
	}

	mainLogger.info(`Couldn't find player '${playerInfo.username}' on any platform.`);

	return new PlayerClass(playerInfo, null);
};

/**
 * Checks if a player was found inside of a match by comparing the match id's.
 * @param potentialPlayerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @returns A player object with some player information and statistics or null.
 */
const verifyThatPlayerWasInMatch = async (potentialPlayerInfo, playerInfo, matchInfo) => {
	const player = await api.fetchPlayer(potentialPlayerInfo);

	if (player !== null) {
		const playerMatches = await api.fetchMatchesForPlayer(potentialPlayerInfo);

		if (playerMatches.length > 0) {
			const match = _.find(playerMatches, { 'matchID': matchInfo.id });

			if (match !== undefined) {
				player.updateInfo(playerInfo);
				return player;
			}
		}
	}

	return null;
};