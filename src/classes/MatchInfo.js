module.exports = class MatchInfo {
	/**
     * Default constructor.
     * @param rawMatch A matches straight from the api.
     * @param playersInfoToFollow An array of the players in the squad of the player who's matches are being fetched.
     * @param otherPlayersInfo An array of the other players in the games of the player who's matches are being fetched.
     */
	constructor(rawMatch, playersInfoToFollow, otherPlayersInfo) {
		this.id = rawMatch.matchID;
		this.mode = rawMatch.mode;
		this.totalPlayers = rawMatch.playerCount;
		this.utcStartSeconds = rawMatch.utcStartSeconds;
		this.utcEndSeconds = rawMatch.utcEndSeconds;
		this.duration = rawMatch.duration;
		this.playersInfoToFollow = playersInfoToFollow;
		this.otherPlayersInfo = otherPlayersInfo;
	}
};