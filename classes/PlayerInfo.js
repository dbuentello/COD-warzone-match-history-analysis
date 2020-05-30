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
		this.team = (player.team !== undefined) ? player.team : '';
	}
};