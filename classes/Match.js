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
				pc: this.countPerPlatform(playersToFollow, otherPlayers, 'battle'),
				psn: this.countPerPlatform(playersToFollow, otherPlayers, 'psn'),
				xbl: this.countPerPlatform(playersToFollow, otherPlayers, 'xbl'),
			},
			playerToFollowAverageStats: {
				wins: this.averagePerLifetimeStatistic(playersToFollow, 'wins'),
				kills: this.averagePerLifetimeStatistic(playersToFollow, 'kills'),
				kdRatio: this.averagePerLifetimeStatistic(playersToFollow, 'kdRatio'),
				timePlayed: this.averagePerLifetimeStatistic(playersToFollow, 'timePlayed'),
				gamesPlayed: this.averagePerLifetimeStatistic(playersToFollow, 'gamesPlayed'),
				scorePerMinute: this.averagePerLifetimeStatistic(playersToFollow, 'scorePerMinute'),
				deaths: this.averagePerLifetimeStatistic(playersToFollow, 'deaths'),
			},
			otherPlayersAverageStats: {
				wins: this.averagePerLifetimeStatistic(otherPlayers, 'wins'),
				kills: this.averagePerLifetimeStatistic(otherPlayers, 'kills'),
				kdRatio: this.averagePerLifetimeStatistic(otherPlayers, 'kdRatio'),
				timePlayed: this.averagePerLifetimeStatistic(otherPlayers, 'timePlayed'),
				gamesPlayed: this.averagePerLifetimeStatistic(otherPlayers, 'gamesPlayed'),
				scorePerMinute: this.averagePerLifetimeStatistic(otherPlayers, 'scorePerMinute'),
				deaths: this.averagePerLifetimeStatistic(otherPlayers, 'deaths'),
			},
		};
		this.players = {
			playersToFollow: playersToFollow,
			otherPlayers: otherPlayers,
		};
	}

	averagePerLifetimeStatistic(players, statistic) {
		let value = 0; let count = 0;

		for (const player of players) {
			if (player.found) {
				value = value + player.statistics[statistic];
				count++;
			}
		}

		return value / count;
	}

	countPerPlatform(playersToFollow, otherPlayers, platform) {
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