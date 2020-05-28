require("dotenv").config();
const fs = require('fs');
const api = require('./helpers/api');
const MatchClass = require('./classes/Match');
const MatchInfoClass = require('./classes/MatchInfo');
const PlayerInfoClass = require('./classes/PlayerInfo');
const { default: PQueue } = require('p-queue');
const log = require('./helpers/log');
const mainLogger = log.mainLogger;
let playerCache = [];

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
                mainLogger.info(`Parsing info for player '${player.username}' on '${player.platform}'.`);

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

const fetchPlayersFromMatch = async (matchInfo, strict) => {
    if (matchInfo === undefined || matchInfo === null) {
        return null;
    }

    let playersToFollow = [];
    let otherPlayers = [];

    mainLogger.info(`Fetching players from match with id '${matchInfo.id}'.`);

    const playerFetchQueue = new PQueue({ concurrency: 4 });

    for (const playerInfo of matchInfo.playersInfoToFollow) {
        const player = playerFetchQueue.add(async () => await fetchPlayerFromApi(playerInfo, matchInfo, strict));

        playersToFollow.push(player);
    }

    for (const playerInfo of matchInfo.otherPlayersInfo) {
        const player = playerFetchQueue.add(async () => await fetchPlayerFromApi(playerInfo, matchInfo, strict));

        if (player !== null) {
            otherPlayers.push(player);
        }
    }

    await playerFetchQueue.onEmpty();

    mainLogger.info(`Fetched ${playersToFollow.length + otherPlayers.length} players from match with id '${matchInfo.id}'.`);

    return new MatchClass(matchInfo, playersToFollow, otherPlayers);
}

const fetchPlayerFromApi = async (playerInfo, matchInfo, strict) => {
    if (playerInfo == undefined || playerInfo == null) {
        return null;
    }

    const cachePlayer = (playerCache.length > 0) ? undefined : playerCache.find(u => u.username == playerInfo.username && u.platform == playerInfo.platform);

    if (cachePlayer !== undefined) {
        mainLogger.info(`Found player '${playerInfo.username}' on '${playerInfo.platform}' in the cache.`);
        return cachePlayer;
    }

    const player = await fetchPlayerThroughFuzzySearch(playerInfo, matchInfo, strict);

    if (player !== null && player !== undefined) {
        playerCache.push(player);
    }

    return player;
}

const fetchPlayerThroughFuzzySearch = async (playerInfo, matchInfo, strict) => {
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

const verifyThatPlayerWasInMatch = async (playerInfo, matchInfo) => {
    const player = await api.fetchPlayer(playerInfo);

    if (player !== null) {
        const playerMatches = await api.fetchMatchesForPlayer(playerInfo);

        if (playerMatches.length > 0 && playerMatches.filter(m => m.matchID == matchInfo.id)) {
            mainLogger.info(`Player ${playerInfo.username} was found in match '${matchInfo.id}' on '${playerInfo.platform}'.`)
            player.platformFound = playerInfo.platform;
            return player;
        }
    }

    mainLogger.info(`Couldn't find player ${playerInfo.username} in match '${matchInfo.id}' on any platform.`)

    return null;
};

const fetchMatches = async (matchesInfo, strict) => {
    let matches = [];

    for (const matchInfo of matchesInfo) {
        const match = await fetchPlayersFromMatch(matchInfo, strict)
        matches.push(match);
    }

    return matches;
};

const main = async () => {
    const playerInfo = { username: 'Evexium#2747', platform: 'battle' }

    // Uncomment this if you have a json file with a raw call from the api for a raw 20 game match history.
    // const rawFile = fs.readFileSync('Vikkstar123 - uno - 20 Recent Matches.json');
    // const jsonParse = JSON.parse(rawFile);

    const rawMatches = await api.fetchMatchesForPlayer(playerInfo);
    const matchesInfo = await parseMatchesInfo(rawMatches);
    const filteredMatch = matchesInfo.filter(m => m.id == '989627047972837858')[0];
    const matches = await fetchMatches([filteredMatch], true);
    const jsonResult = JSON.stringify(matches);

    fs.writeFile(`Analysis of match with id ${filteredMatch.id} following ${playerInfo.username} on ${playerInfo.platform}.json`, jsonResult, function (error) {
        if (error)
            mainLogger.info(`Failed to write data to a file: ${error}`);
    });
};

main();
