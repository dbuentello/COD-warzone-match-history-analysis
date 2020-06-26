const platforms = { 'battlenet': 'battle', 'battle': 'battle', 'ps4': 'psn', 'psn': 'psn', 'xb3': 'xbl', 'xbl': 'xbl', 'uno': 'uno' };

module.exports = class PlayerInfo {
	/**
	 * Default constructor.
	 * @param player Raw player object from a match.
	 */
	constructor(player) {
		this.inGameName = player.username;
		this.username = (player.username.split(']').pop() !== '') ? player.username.split(']').pop() : player.username;
		this.platform = platforms[player.platform];
		this.platformFound = '';

		if (player.team !== undefined) {
			this.team = player.team;
			this.gameStatistics = {
				kills: player.playerStats.kills,
				kdRatio: player.playerStats.kdRatio,
				score: player.playerStats.score,
				timePlayed: player.playerStats.timePlayed,
				percentTimeMoving: player.playerStats.percentTimeMoving,
				longestStreak: player.playerStats.longestStreak,
				scorePerMinute: player.playerStats.scorePerMinute,
				damageDone: player.playerStats.damageDone,
				distanceTraveled: player.playerStats.distanceTraveled,
				deaths: player.playerStats.deaths,
				damageTaken: player.playerStats.damageTaken,
			};
		}
	}
};