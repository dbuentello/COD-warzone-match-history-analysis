const platforms = { 'battlenet': 'battle', 'ps4': 'psn', 'xb3': 'xbl' };

module.exports = class PlayerInfo {
    constructor(player) {
        this.username = (player.username.split("]").pop() !== '') ? player.username.split("]").pop() : player.username;
        this.platform = platforms[player.platform];
        this.platformFound;
        this.team = player.team;
    }
};