module.exports = class CachePlayer {
	/**
	 * Default constructor.
	 * @param playerInfo Player information used to fetch the player from the api.
	 * @param data Warzone data from the api out of the cache.
	 */
	constructor(playerInfo, data) {
		const dataIsValid = (!(Object.keys(data['br']).length == 0) && data !== null) ? true : false;

		this.info = {
			username: playerInfo.username,
			platform: playerInfo.platform,
		};
		this.statistics = {
			wins: (dataIsValid) ? data.br.wins : 0,
			kills: (dataIsValid) ? data.br.kills : 0,
			kdRatio: (dataIsValid) ? data.br.kdRatio : 0,
			timePlayed: (dataIsValid) ? data.br.timePlayed : 0,
			gamesPlayed: (dataIsValid) ? data.br.gamesPlayed : 0,
			scorePerMinute: (dataIsValid) ? data.br.scorePerMinute : 0,
			deaths: (dataIsValid) ? data.br.deaths : 0,
		};

		console.log(JSON.stringify(this));
	}
};