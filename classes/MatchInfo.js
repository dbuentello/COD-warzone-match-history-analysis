module.exports = class MatchInfo {
    constructor(rawMatch, playersInfoToFollow, otherPlayersInfo) {
        this.id = rawMatch.matchID;
        this.mode = rawMatch.mode;
        this.playerCount = rawMatch.playerCount;
        this.utcStartSeconds = rawMatch.utcStartSeconds;
        this.utcEndSeconds = rawMatch.utcEndSeconds;
        this.duration = rawMatch.duration;
        this.playersInfoToFollow = playersInfoToFollow;
        this.otherPlayersInfo = otherPlayersInfo;
    }
};