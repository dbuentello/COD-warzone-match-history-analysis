const api = require("call-of-duty-api")();
const config = require('../config.js');
const PlayerClass = require('../classes/Player');
const { apiLogger: logger } = require('../helpers/log');
let emailAddressIndex = 0;

const selectNextEmailAddress = () => {
    (emailAddressIndex < config.emails.length - 1) ? emailAddressIndex++ : emailAddressIndex = 0;
    return config.emails[emailAddressIndex];
};

const loginToApi = async () => {
    const loggedIn = await api.login(process.env.PERSONALEMAIL, process.env.PERSONALPASSWORD).then(() => {
        return true;
    }).catch((error) => {
        logger.error(`Login failed: ${error}`);
        return false;
    });

    return loggedIn;
};

const fuzzySearchUsername = async (username) => {
    const loggedIn = await loginToApi();

    if (loggedIn == false) {
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

const fetchMatchesForPlayer = async (playerInfo) => {
    const loggedIn = await loginToApi();

    if (loggedIn == false) {
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

const fetchPlayer = async (playerInfo) => {
    const loggedIn = await loginToApi();

    if (loggedIn == false) {
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