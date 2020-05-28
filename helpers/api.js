const api = require("call-of-duty-api")();
const cache = require('./cache.js');
const config = require('../config.js');
const PlayerClass = require('../classes/Player');
const { apiLogger: logger } = require('../helpers/log');
let emailAddressIndex = 0;

/** 
 * Grabs the next email address from the area inside of the config file.
 * @returns An email address to login with.
 */
const selectNextEmailAddress = () => {
    (emailAddressIndex < config.emails.length - 1) ? emailAddressIndex++ : emailAddressIndex = 0;
    return config.emails[emailAddressIndex];
};

/** 
 * Logs into the api and checks if the login was successfull.
 * @returns A boolean
 */
const loginToApi = async () => {
    const loggedIn = await api.login(selectNextEmailAddress(), process.env.PASSWORD).then(() => {
        return true;
    }).catch((error) => {
        logger.error(`Login failed: ${error}`);
        return false;
    });

    return loggedIn;
};

/** 
 * Searches for all hits of a player with the given username
 * @param username The name of the player inside the match.
 * @returns An array of all players found with the username in their name.
 */
const fuzzySearchUsername = async (username) => {
    const loggedIn = await loginToApi();

    logger.info(`Fuzzy searching '${username}'.`);

    if (loggedIn == false) {
        logger.error(`Fuzzy search failed for username '${username}': Not logged in.`);
        return [];
    }

    return await api.FuzzySearch(username, api.platforms.all).then((data) => {
        logger.info(`Fuzzy search for '${username}' resulted in ${data.length} hits.`);
        return (data.length > 0) ? data : [];
    }).catch((error) => {
        logger.error(`Fuzzy search failed for username '${username}': ${error}`);
        return [];
    });
};

/** 
 * Fetches matches for a player from the api.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @returns An array of raw matches.
 */
const fetchMatchesForPlayer = async (playerInfo) => {
    const loggedIn = await loginToApi();

    logger.info(`Fetching matches for '${playerInfo.username}' on '${playerInfo.platform}'.`);

    if (loggedIn == false) {
        logger.error(`Could not fetch matches for '${playerInfo.username}' on '${playerInfo.platform}': Not logged in.`);
        return [];
    }

    return await api.MWcombatwz(playerInfo.username, api.platforms[playerInfo.platform]).then((data) => {
        const matches = (data.matches == null) ? [] : data.matches;
        logger.info(`Fetched ${matches.length} matches for '${playerInfo.username}' on '${playerInfo.platform}'.`);
        return matches;
    }).catch((error) => {
        logger.error(`Could not fetch matches for '${playerInfo.username}' on '${playerInfo.platform}': ${error}`);
        return [];
    });
};

/** 
 * Fetches a player from the api or if already fetched from the playerCache.
 * @param playerInfo Cleaned up object containing the necessary information for a player.
 * @returns A player object with some player information and statistics or null.
 */
const fetchPlayer = async (playerInfo) => {
    const loggedIn = await loginToApi();

    logger.info(`Fetching player '${playerInfo.username}' on '${playerInfo.platform}'.`);

    const cachePlayer = (cache.players.length > 0) ? undefined : cache.players.find(u => u.username == playerInfo.username && u.platform == playerInfo.platform);

    if (cachePlayer !== undefined) {
        mainLogger.info(`Found player '${playerInfo.username}' on '${playerInfo.platform}' in the cache.`);
        return cachePlayer;
    }

    if (loggedIn == false) {
        logger.error(`Couldn't fetch '${playerInfo.username}' on '${playerInfo.platform}': Not logged in.`);
        return new PlayerClass(playerInfo, null);;
    }

    return await api.MWwz(playerInfo.username, api.platforms[playerInfo.platform]).then((data) => {
        logger.info(`Fetched player '${playerInfo.username}' on '${playerInfo.platform}'.`);
        return new PlayerClass(playerInfo, data);
    }).catch((error) => {
        logger.error(`Couldn't fetch '${playerInfo.username}' on '${playerInfo.platform}': ${error}`);
        return new PlayerClass(playerInfo, null);;
    });
};

module.exports = {
    selectNextEmailAddress,
    fuzzySearchUsername,
    fetchMatchesForPlayer,
    fetchPlayer
}