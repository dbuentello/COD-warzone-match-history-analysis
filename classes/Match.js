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
			playerToFollowAverageGameStatistics: {
				kills: this.averageByStatistic(playersToFollow, 'kills', false),
				kdRatio: this.averageByStatistic(playersToFollow, 'kdRatio', false),
				score: this.averageByStatistic(playersToFollow, 'score', false),
				timePlayed: this.averageByStatistic(playersToFollow, 'timePlayed', false),
				percentTimeMoving: this.averageByStatistic(playersToFollow, 'percentTimeMoving', false),
				longestStreak: this.averageByStatistic(playersToFollow, 'longestStreak', false),
				scorePerMinute: this.averageByStatistic(playersToFollow, 'scorePerMinute', false),
				damageDone: this.averageByStatistic(playersToFollow, 'damageDone', false),
				distanceTraveled: this.averageByStatistic(playersToFollow, 'distanceTraveled', false),
				deaths: this.averageByStatistic(playersToFollow, 'deaths', false),
				damageTaken: this.averageByStatistic(playersToFollow, 'damageTaken', false),

			},
			otherPlayersAverageGameStatistics: {
				kills: this.averageByStatistic(otherPlayers, 'kills', false),
				kdRatio: this.averageByStatistic(otherPlayers, 'kdRatio', false),
				score: this.averageByStatistic(otherPlayers, 'score', false),
				timePlayed: this.averageByStatistic(otherPlayers, 'timePlayed', false),
				percentTimeMoving: this.averageByStatistic(otherPlayers, 'percentTimeMoving', false),
				longestStreak: this.averageByStatistic(otherPlayers, 'longestStreak', false),
				scorePerMinute: this.averageByStatistic(otherPlayers, 'scorePerMinute', false),
				damageDone: this.averageByStatistic(otherPlayers, 'damageDone', false),
				distanceTraveled: this.averageByStatistic(otherPlayers, 'distanceTraveled', false),
				deaths: this.averageByStatistic(otherPlayers, 'deaths', false),
				damageTaken: this.averageByStatistic(otherPlayers, 'damageTaken', false),
			},
			playerToFollowAverageLifetimeStatistics: {
				wins: this.averageByStatistic(playersToFollow, 'wins', true),
				kills: this.averageByStatistic(playersToFollow, 'kills', true),
				kdRatio: this.averageByStatistic(playersToFollow, 'kdRatio', true),
				timePlayed: this.averageByStatistic(playersToFollow, 'timePlayed', true),
				gamesPlayed: this.averageByStatistic(playersToFollow, 'gamesPlayed', true),
				scorePerMinute: this.averageByStatistic(playersToFollow, 'scorePerMinute', true),
				deaths: this.averageByStatistic(playersToFollow, 'deaths', true),
			},
			otherPlayersAverageLifetimeStatistics: {
				wins: this.averageByStatistic(otherPlayers, 'wins', true),
				kills: this.averageByStatistic(otherPlayers, 'kills', true),
				kdRatio: this.averageByStatistic(otherPlayers, 'kdRatio', true),
				timePlayed: this.averageByStatistic(otherPlayers, 'timePlayed', true),
				gamesPlayed: this.averageByStatistic(otherPlayers, 'gamesPlayed', true),
				scorePerMinute: this.averageByStatistic(otherPlayers, 'scorePerMinute', true),
				deaths: this.averageByStatistic(otherPlayers, 'deaths', true),
			},
		};
		this.players = {
			playersToFollow: playersToFollow,
			otherPlayers: otherPlayers,
		};
	}

	averageByStatistic(players, statistic, lifetime) {
		let value = 0; let count = 0;

		for (const player of players) {
			if (player.found) {
				value = (lifetime) ? value + player.lifetimeStatistics[statistic] : value + player.gameStatistics[statistic];
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