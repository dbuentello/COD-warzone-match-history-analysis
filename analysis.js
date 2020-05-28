require("dotenv").config();
const cache = require('./helpers/cache')
const fs = require('fs').promises;
const api = require('./helpers/api');
const MatchClass = require('./classes/Match');
const MatchInfoClass = require('./classes/MatchInfo');
const PlayerInfoClass = require('./classes/PlayerInfo');
const { default: PQueue } = require('p-queue');
const log = require('./helpers/log');
const mainLogger = log.mainLogger;

/** 
 * Parses raw data from the api to more readable and useable data.
 * @param rawMatches The matches straight from the api.
 * @returns An array of matches cleaned up into MatchInfo objects.
 */
const parseMatchesInfo = async (rawMatches) => {
    if (rawMatches === undefined) {
        return null;
    }

    let matchesInfo = []

    for (const rawMatch of rawMatches) {
        mainLogger.info(`Parsing info for match with id '${rawMatch.matchID}'.`);

        let playersInfoToFollow = [];
        let otherPlayersInfo = [];

        for (const rankedTeam of rawMatch.rankedTeams) {
            for (const player of rankedTeam.players) {
                const filteredPlayer = new PlayerInfoClass(player);

                if (player.team == rawMatch.player.team)
                    playersInfoToFollow.push(filteredPlayer);
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
 * Fetches all players it can find from a matchInfo object.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user by fuzzy searching and comparing match history.
 * @returns A match object with some match information, statistics, and all players found in that match from the api.
 */
const fetchPlayersFromMatch = async (matchInfo, strict) => {
    if (matchInfo === undefined || matchInfo === null) {
        return null;
    }

    let playersToFollow = [];
    let otherPlayers = [];

    mainLogger.info(`Fetching players from match with id '${matchInfo.id}'.`);

    const playerFetchQueue = new PQueue({ concurrency: 4 });

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

    await playerFetchQueue.onEmpty();
    await cache.addPlayersToCache(playersToFollow.concat(otherPlayers));

    mainLogger.info(`Fetched ${playersToFollow.length + otherPlayers.length} players from match with id '${matchInfo.id}'.`);

    return new MatchClass(matchInfo, playersToFollow, otherPlayers);
}

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
        const potentialPlayer = (strict) ? await verifyThatPlayerWasInMatch(potentialPlayerInfo, matchInfo) : await api.fetchPlayer(potentialPlayerInfo);

        if (potentialPlayer !== null) {
            return potentialPlayer;
        }
    }

    return null;
};

/** 
 * Checks if a player was found inside of a match by comparing the match id's.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @returns A player object with some player information and statistics or null.
 */
const verifyThatPlayerWasInMatch = async (playerInfo, matchInfo) => {
    const cachePlayer = (cache.players.length > 0) ? undefined : cache.players.find(u => u.username == playerInfo.username && u.platform == playerInfo.platform);

    const player = (cachePlayer !== undefined) ? cachePlayer : await api.fetchPlayer(playerInfo);

    if (player !== null) {
        const playerMatches = await api.fetchMatchesForPlayer(playerInfo);

        if (playerMatches.length > 0 && playerMatches.filter(m => m.matchID == matchInfo.id)) {
            mainLogger.info(`Player ${playerInfo.username} was found in match '${matchInfo.id}' on '${playerInfo.platform}'.`)
            player.platformFound = playerInfo.platform;
            return player;
        }
    }

    mainLogger.info(`Couldn't find player '${playerInfo.username}' on '${playerInfo.platform}' in match '${matchInfo.id}'.`)

    return null;
};

/** 
 * Fetches matches from the api using the matchesInfo.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
 * @param strict Boolean that is used to decide whether the program should or should not fetch a user down the line by fuzzy searching and comparing match history.
 * @returns A player object with some player information and statistics or null.
 */
const fetchMatches = async (matchesInfo, strict) => {
    let matches = [];

    for (const matchInfo of matchesInfo) {
        const match = await fetchPlayersFromMatch(matchInfo, strict)
        matches.push(match);
    }

    return matches;
};

/** 
 * Writes a match to a json file.
 * @param match Cleaned up object containing the necessary information to fetch all users from it.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 */
const writeMatchToFile = async (match, playerInfo) => {
    await fs.writeFile(`Analysis of match with id ${match.id} following ${playerInfo.username} on ${playerInfo.platform}.json`, jsonResult, function (error) {
        if (error) {
            mainLogger.info(`Failed to write data to a file: ${error}`);
        }
    });
};

const main = async () => {
    await cache.loadPlayersFromCache();
    const playerInfo = { username: 'Evexium#2747', platform: 'battle' }

    // Uncomment this if you have a json file with a raw call from the api for a raw 20 game match history.
    // const rawFile = fs.readFileSync('Vikkstar123 - uno - 20 Recent Matches.json');
    // const jsonParse = JSON.parse(rawFile);

    const rawMatches = await api.fetchMatchesForPlayer(playerInfo);
    const matchesInfo = await parseMatchesInfo(rawMatches);

    if (matchesInfo.length > 0) {
        const filteredMatch = matchesInfo.filter(m => m.id == '989627047972837858')[0];
        const matches = await fetchMatches([filteredMatch], true);

        await writeMatchToFile(matches[0], playerInfo);
    };
};

main();
