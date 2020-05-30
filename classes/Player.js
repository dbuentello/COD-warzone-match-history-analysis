module.exports = class Player {
	/**
	 * Default constructor.
	 * @param playerInfo Cleaned up object containing the necessary information for a player.
	 * @param data Warzone data from the api.
	 */
	constructor(playerInfo, data) {
		const dataIsValid = (data === null || Object.keys(data['br']).length === 0) ? false : true;

		this.info = playerInfo;
		this.found = dataIsValid;
		this.statistics = (dataIsValid) ? {
			wins: data.br.wins,
			kills: data.br.kills,
			kdRatio: data.br.kdRatio,
			timePlayed: data.br.timePlayed,
			gamesPlayed: data.br.gamesPlayed,
			scorePerMinute: data.br.scorePerMinute,
			deaths: data.br.deaths,
		} : 'No matching user was found for this player. So statistics could not be fetched.';
	}

	updateInfo(potentialPlayerInfo, playerInfo) {
		this.info.inGameName = playerInfo.username;
		this.info.username = potentialPlayerInfo.username;
		this.info.platform = playerInfo.platform;
		this.info.platformFound = potentialPlayerInfo.platform;
		this.info.team = playerInfo.team;
	}
};