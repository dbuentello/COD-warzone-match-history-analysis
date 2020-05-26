require("dotenv").config();
const config = require('./config.js');
const _ = require("lodash");
const fs = require("fs");
const platforms = { 'battlenet': 'battle', 'ps4': 'psn', 'xb3': 'xbl' };
let userCache = [];

const selectNextEmailAddress = () => {
    (emailAddressIndex < config.emails.length - 1) ? emailAddressIndex++ : emailAddressIndex = 0;

    return config.emails[emailAddressIndex];
};

const fetchMatchesForUser = async (username, platform) => {
    const api = require("call-of-duty-api")({ platform: `${platform}` });
    await api.login(selectNextEmailAddress(), process.env.PERSONALPASSWORD).catch(console.error);
    return await api.MWcombatwz(username).then((data) => { return data.matches; }).catch(console.error);
};

const fetchUser = async (player) => {
    const api = require('call-of-duty-api')({ platform: `${(player.platform == 'battle') ? 'uno' : player.platform}` });
    const cacheUser = userCache.find(u => u.username == player.username && u.platform == player.platform);

    if (cacheUser === undefined) {
        await api.login(process.env.PERSONALEMAIL, process.env.PERSONALPASSWORD).catch(console.error);
        const user = await api.MWwz(player.username).then((data) => { console.log(`Found user: ${player.username} - ${player.platform}.`); return filterUserStats(player, data); }).catch((error) => { console.error(`Couldn't find user: ${player.username} - ${player.platform}: ${error}`); return null; });

        if (user !== null)
            userCache.push(user);

        return user;
    }
    else {
        return cacheUser;
    }
};

const fetchPlayerInfoFromMatches = (rawMatches, usernameToFollow) => {
    let filteredMatches = [];

    for (const match of rawMatches) {
        let playersInfo = [];
        let playersToFollow = [];

        for (const rankedTeam of match.rankedTeams) {
            for (const player of rankedTeam.players) {
                const filteredPlayer = {
                    username: (player.username.split("]").pop() !== '') ? player.username.split("]").pop() : player.username,
                    platform: platforms[player.platform],
                };

                if (player.team == match.player.team)
                    playersToFollow.push(filteredPlayer);
                else {
                    playersInfo.push(filteredPlayer);
                }
            }
        }

        filteredMatches.push({
            matchId: match.matchID,
            totalPlayers: match.playerCount,
            battlePlayerCount: _.countBy(playersInfo, (u) => u.platform == 'battle').true,
            psnPlayerCount: _.countBy(playersInfo, (u) => u.platform == 'psn').true,
            xblPlayerCount: _.countBy(playersInfo, (u) => u.platform == 'xbl').true,
            playersToFollow: playersToFollow,
            otherPlayers: playersInfo
        });
    }

    return filteredMatches;
};

const filterUserStats = (player, data) => {
    return {
        username: player.username,
        platform: player.platform,
        kdRatio: (data.br.kdRatio),
        scorePerMinute: (data.br.scorePerMinute),
    };
};

const fetchAllUsersFromMatch = async (match) => {
    let usersToFollowStats = [];
    let otherUsersStats = [];

    console.log(`Fetching users from match with id '${match.matchId}'.`);

    for (const player of match.playersToFollow) {
        const user = await fetchUser(player);

        if (user !== null) {
            usersToFollowStats.push(user);
        }
    }

    for (const player of match.otherPlayers) {
        const user = await fetchUser(player);
        if (user !== null) {
            otherUsersStats.push(user);
        }
    }

    return {
        usersToFollow: usersToFollowStats,
        otherUsers: otherUsersStats
    }
}

const analyzeMatch = async (match) => {
    if (match !== undefined) {
        const userStats = await fetchAllUsersFromMatch(match);

        return {
            matchId: match.matchId,
            totalPlayers: match.totalPlayers,
            totalPlayersFound: userStats.usersToFollow.length + userStats.otherUsers.length,
            battlePlayerCount: match.battlePlayerCount,
            psnPlayerCount: match.psnPlayerCount,
            xblPlayerCount: match.xblPlayerCount,
            usersToFollowAverage: {
                kdRatio: _.meanBy(userStats.usersToFollow, 'kdRatio'),
                scorePerMinute: _.meanBy(userStats.usersToFollow, 'scorePerMinute')
            },
            otherUsersAverage: {
                kdRatio: _.meanBy(userStats.otherUsers, 'kdRatio'),
                scorePerMinute: _.meanBy(userStats.otherUsers, 'scorePerMinute')
            },
            usersToFollow: userStats.usersToFollow,
            otherUsers: userStats.otherUsers
        }
    }
};

const main = async () => {
    const username = "Caedrius";
    const platform = "uno";
    const status = "normal";

    // Uncomment this if you have a json file with a raw call from the api for a raw 20 game match history.
    // const rawFile = fs.readFileSync('Vikkstar123 - uno - 20 Recent Matches.json');
    // const jsonParse = JSON.parse(rawFile);
    //const filteredMatches = fetchPlayerInfoFromMatches(jsonParse, username);

    const rawMatches = await fetchMatchesForUser(username, platform);
    const filteredMatches = fetchPlayerInfoFromMatches(rawMatches, username);
    // Use this to filter matches by id.
    //let results = await analyzeMatch(filteredMatches.filter(m => m.matchId == '11772290078792940796')[0]);

    const jsonResult = JSON.stringify(results);

    fs.writeFile(`${username} - ${platform} - ${status} - random good game analysis.json`, jsonResult, function (error) {
        if (error) console.error(error);
    });
};

main();
