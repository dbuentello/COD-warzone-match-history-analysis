module.exports = class Player {
	/**
	 * Default constructor.
	 * @param playerInfo Cleaned up object containing the necessary information for a player.
	 * @param data Warzone data from the api.
	 */
	constructor(playerInfo, data) {
		const dataIsValid = (data === null || Object.keys(data).length === 0 || Object.keys(data.lifetime).length === 0 || Object.keys(data.lifetime.mode).length === 0 || Object.keys(data.lifetime.mode['br']).length === 0 || Object.keys(data.lifetime.mode.br.properties).length === 0) ? false : true;

		this.info = {
			inGameName: '',
			username: playerInfo.username,
			platform: '',
			platformFound: playerInfo.platform,
			team: '',
		};
		this.found = dataIsValid;
		this.gameStatistics = {};
		this.lifetimeStatistics = (dataIsValid) ? {
			wins: data.lifetime.mode.br.properties.wins,
			kills: data.lifetime.mode.br.properties.kills,
			kdRatio: data.lifetime.mode.br.properties.kdRatio,
			timePlayed: data.lifetime.mode.br.properties.timePlayed,
			gamesPlayed: data.lifetime.mode.br.properties.gamesPlayed,
			scorePerMinute: data.lifetime.mode.br.properties.scorePerMinute,
			deaths: data.lifetime.mode.br.properties.deaths,
		} : 'No matching user was found for this player. So statistics could not be fetched.';
	}

	updateInfo(playerInfo, found) {
		this.info.inGameName = playerInfo.inGameName;
		this.info.platform = playerInfo.platform;
		this.info.team = playerInfo.team;
		this.gameStatistics = playerInfo.gameStatistics;

		if (found === false) {
			delete this.info.username;
			delete this.info.platformFound;
		}
	}
};