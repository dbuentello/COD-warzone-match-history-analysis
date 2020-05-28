const fs = require('fs').promises;
let players = [];

/** 
 * Fetches all players in the player cache and insert them into the players array.
 */
const loadPlayersFromCache = async () => {
    const cacheFile = await fetchCacheFile();

    if (cacheFile == undefined) {
        mainLogger.info(`Couldn't load players from cache: ${error}`);
        return;
    }

    players = JSON.parse(cacheFile);

    console.log(players);
};

/** 
 * Fetches the cache file
 * @returns A cache file.
 */
const fetchCacheFile = async () => {
    return await fs.readFile(`./cache.json`, function (error) {
        if (error) {
            mainLogger.info(`Failed to read file 'cache.json': ${error}`);
            return undefined;
        }
    });
};

/** 
 * Add an array of players to the player cache.
 * @param player A player object with some player information and statistics.
 */
const addPlayersToCache = async (players) => {
    const cacheFile = await fetchCacheFile();

    if (cacheFile == undefined) {
        return;
    }

    let cachePlayers = JSON.parse(cacheFile);

    for (const player of players) {
        const cachePlayer = (players.length > 0) ? undefined : players.find(u => u.username == player.info.username && u.platform == player.info.platform);

        if (cachePlayer === undefined) {
            console.log('Added player to cache array');
            cachePlayers.push(player);
        }
    }

    players.concat(cachePlayers);
    const cachePlayersJson = JSON.stringify(cachePlayers)

    await fs.writeFile(`cache.json`, cachePlayersJson, function (error) {
        if (error) {
            mainLogger.info(`Failed to write data to 'cache.json': ${error}`);
            return;
        }
        mainLogger.info(`Added ${cachePlayers.length} to 'cache.json'.`);
    });
};

module.exports = {
    players,
    loadPlayersFromCache,
    addPlayersToCache
};