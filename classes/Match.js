const _ = require("lodash");

module.exports = class Match {
    constructor(matchInfo, playersToFollow, otherPlayers) {
        this.id = matchInfo.id;
        this.info = {
            utcStartSeconds: matchInfo.utcStartSeconds,
            utcEndSeconds: matchInfo.utcEndSeconds,
            duration: matchInfo.duration,
        };
        this.statistics = {
            totalPlayers: match.playerCount,
            totalPlayersFound: (playersToFollow.length + otherPlayers.length),
            // countPerPlatform: {
            //     pc: _.countBy(playersInfo, (u) => u.platform == 'battle' || u.platform == 'uno').true,
            //     psn: _.countBy(playersInfo, (u) => u.platform == 'psn').true,
            //     xbl: _.countBy(playersInfo, (u) => u.platform == 'xbl').true,
            // },
            // playerToFollowAverageStats: {
            //     wins: _meanBy(playersToFollow, _.flow(_.property('stats'), 'wins')),
            //     kills: _.meanBy(playersToFollow, 'kills'),
            //     kdRatio: _.meanBy(playersToFollow, 'kdRatio'),
            //     timePlayed: _.meanBy(playersToFollow, 'timePlayed'),
            //     gamesPlayed: _.meanBy(playersToFollow, 'gamesPlayed'),
            //     scorePerMinute: _.meanBy(playersToFollow, 'scorePerMinute'),
            //     deaths: _.meanBy(playersToFollow, 'deaths')
            // },
            // otherPlayersAverageStats: {
            //     wins: _.meanBy(otherPlayers, 'wins'),
            //     kills: _.meanBy(otherPlayers, 'kills'),
            //     kdRatio: _.meanBy(otherPlayers, 'kdRatio'),
            //     timePlayed: _.meanBy(otherPlayers, 'timePlayed'),
            //     gamesPlayed: _.meanBy(otherPlayers, 'gamesPlayed'),
            //     scorePerMinute: _.meanBy(otherPlayers, 'scorePerMinute'),
            //     deaths: _.meanBy(otherPlayers, 'deaths')
            // },
        };
        this.players = {
            playersToFollow: playersToFollow,
            otherPlayers: otherPlayers
        };
    }
};