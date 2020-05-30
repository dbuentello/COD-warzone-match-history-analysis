const _ = require('lodash');

module.exports = class Match {
	/**
     * Default constructor
     * @param matchInfo Cleaned up object containing the necessary information to fetch all users from it.
     * @param playersToFollow An array of cleaned up player objects that are in the team of the player who's matches are being fetched.
     * @param otherPlayers An array of cleaned up player objects that are in the game of the player who's matches are being fetched.
     */
	constructor(matchInfo, playersToFollow, otherPlayers) {
		this.id = matchInfo.id;
		this.info = {
			utcStartSeconds: matchInfo.utcStartSeconds,
			utcEndSeconds: matchInfo.utcEndSeconds,
			duration: matchInfo.duration,
		};
		this.statistics = {
			totalPlayers: matchInfo.totalPlayers,
			totalPlayersFound: this.countByFound(playersToFollow, otherPlayers),
			countPerPlatform: {
				pc: this.countByPlatform(playersToFollow, otherPlayers, 'battle'),
				psn: this.countByPlatform(playersToFollow, otherPlayers, 'psn'),
				xbl: this.countByPlatform(playersToFollow, otherPlayers, 'xbl'),
			},
			playerToFollowAverageStats: {
				wins: this.averageByStatistic(playersToFollow, 'wins'),
				kills: this.averageByStatistic(playersToFollow, 'kills'),
				kdRatio: this.averageByStatistic(playersToFollow, 'kdRatio'),
				timePlayed: this.averageByStatistic(playersToFollow, 'timePlayed'),
				gamesPlayed: this.averageByStatistic(playersToFollow, 'gamesPlayed'),
				scorePerMinute: this.averageByStatistic(playersToFollow, 'scorePerMinute'),
				deaths: this.averageByStatistic(playersToFollow, 'deaths'),
			},
			otherPlayersAverageStats: {
				wins: this.averageByStatistic(otherPlayers, 'wins'),
				kills: this.averageByStatistic(otherPlayers, 'kills'),
				kdRatio: this.averageByStatistic(otherPlayers, 'kdRatio'),
				timePlayed: this.averageByStatistic(otherPlayers, 'timePlayed'),
				gamesPlayed: this.averageByStatistic(otherPlayers, 'gamesPlayed'),
				scorePerMinute: this.averageByStatistic(otherPlayers, 'scorePerMinute'),
				deaths: this.averageByStatistic(otherPlayers, 'deaths'),
			},
		};
		this.players = {
			playersToFollow: playersToFollow,
			otherPlayers: otherPlayers,
		};
	}

	averageByStatistic(players, statistic) {
		let value = 0; let count = 0;

		for (const player of players) {
			if (player.found) {
				value = value + player.statistics[statistic];
				count++;
			}
		}

		return value / count;
	}

	countByPlatform(playersToFollow, otherPlayers, platform) {
		const countPlayersToFollow = _.countBy(playersToFollow, function(p) { return p.info.platform === platform; }).true;
		const countOtherPlayers = _.countBy(otherPlayers, function(p) { return p.info.platform === platform; }).true;

		return ((isNaN(countPlayersToFollow)) ? 0 : countPlayersToFollow) + ((isNaN(countOtherPlayers)) ? 0 : countOtherPlayers);
	}

	countByFound(playersToFollow, otherPlayers) {
		const countPlayersToFollow = _.countBy(playersToFollow, function(p) { return p.found === true; }).true;
		const countOtherPlayers = _.countBy(otherPlayers, function(p) { return p.found === true; }).true;

		return ((isNaN(countPlayersToFollow)) ? 0 : countPlayersToFollow) + ((isNaN(countOtherPlayers)) ? 0 : countOtherPlayers);
	}
};