module.exports = class Player {
    constructor(playerInfo, data) {
        this.info = playerInfo;
        this.found = (data !== null) ? true : false;
        this.stats = {
            wins: (data !== null) ? data.br.wins : 0,
            kills: (data !== null) ? data.br.kills : 0,
            kdRatio: (data !== null) ? data.br.kdRatio : 0,
            timePlayed: (data !== null) ? data.br.timePlayed : 0,
            gamesPlayed: (data !== null) ? data.br.gamesPlayed : 0,
            scorePerMinute: (data !== null) ? data.br.scorePerMinute : 0,
            deaths: (data !== null) ? data.br.deaths : 0
        }
    }
};