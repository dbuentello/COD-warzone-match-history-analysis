const Datastore = require('nedb-promises');
let dataStore = Datastore.create('./playerCache.db');
let players = []

//Non functional. Need to do research on how nedb works.

const loadPlayersCache = async () => {
	const test = await dataStore.load();
	players = test;
};

const addPlayerToCache = async () => {

};

const fetchPlayerFromCache = async (playerInfo) => {
	const cachePlayer = dataStore.findOne({ info: { username: playerInfo.username, platform: playerInfo.platform } });

	return cachePlayer;
};

module.exports = {
	loadPlayersCache,
	addPlayerToCache,
	fetchPlayerFromCache,
}