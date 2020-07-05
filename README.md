# Welcome to the Call of Duty Match History Analyser
A small but useful script to analyse your Warzone matches.

### Get started
You must first install [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/). After that setting up is extremely easy, just issue the following commands:
```shell
$ git clone https://github.com/dtslubbersen/COD-warzone-match-history-analysis.git
$ cd ./COD-warzone-match-history-analysis
$ npm install
```
Then make a `config.js` and a `.env` file following the formats shown in `configexample.cs` and `.envexample`. 

Keep in mind trying to fetch all players from one match can use anywhere from 3000 to 5000 api requests. Add more then one Call of Duty account to your `config.js. One account will be rate limited before you can finish fetching one match. If you've done that you're ready to run the script by issuing:
```shell
$ cd ./src
$ node analysis.js
```
That's it! Pst. Consider **starring** the repository if you like it! <3

### To do
- [ ] Build a player cache to reduce API calls when analysing multiple matches in a row.
- [ ] More an better error handling.

### Step by step of how it works

#### Fetches match history
The past 20 matches for the given user name and platform are fetched. Raw data is cleaned up into a list of `MatchInfo` classes. Players are also extracted and put into 2 lists inside of `PlayerInfo`; `playersToFollow` (the team of the given username) and `otherPlayersToFollow`

#### Loops through matches
For each match in the array the script tries fetching as many players as possible to run calculations afterwards. There is however a catch. The player name in the match history is the display name. For example a players [BattleTag](https://eu.battle.net/support/en/article/75767) can be `Foo` but their display name can be `[CLAN]Bar`.

##### Fetches as many players as possible from a match
1. Uses the FuzzySearch endpoint to search the display name without the clan tag. 
```json
{
  "platform": "uno",
  "username": "SHROUD",
  "accountId": "15524685984750163012",
  "avatar": null
},
{
  "platform": "psn",
  "username": "SHROUD",
  "avatar": null
},
{
  "platform": "uno",
  "username": "ShRouD",
  "accountId": "19574536",
  "avatar": null
}
```
> Fraction of the output returned when searching the username `Shroud`.

![Call of Duty Privacy Settings](https://github.com/dtslubbersen/COD-warzone-match-history-analysis/blob/master/images/PrivacySettings.png)
> A player will not be found is their privacy settings aren't set like in the image for their platform.
2. Filters the FuzzySearch to the platform in the `PlayerInfo` object and Activision Id (uno)
3. Fetches the past 20 matches for every single result in the filtered FuzzySearch and checks for a `matchID` match. 
4. It keeps fetching the filtered FuzzySearch result until a player is found. If no player is found it moves on to the get FuzzySearch.

#### Runs some calculations and outputs to file
The scripts then makes some calculations based off of the fetched data and writes everything to a `.json` file.
```json
{
    "id": "1234567891011121314",
    "info": {
        "utcStartSeconds": 1.00,
        "utcEndSeconds": 1.00,
        "duration": 1.00
    },
    "statistics": {
        "totalPlayers": 152,
        "totalPlayersFound": 120,
        "countPerPlatform": {
            "pc": 40,
            "psn": 40,
            "xbl": 40
        },
        "playerToFollowAverageGameStatistics||otherPlayersAverageGameStatistics": {
            "kills": 1.00,
            "kdRatio": 1.00,
            "score": 1.00,
            "timePlayed": 1.00,
            "percentTimeMoving": 1.00,
            "longestStreak": 1.00,
            "scorePerMinute": 1.00,
            "damageDone": 1.00,
            "distanceTraveled": 1.00,
            "deaths": 1.00,
            "damageTaken": 1.00
        },
        "playerToFollowAverageLifetimeStatistics||otherPlayersAverageLifetimeStatistics": {
            "wins": 1.00,
            "kills": 1.00,
            "kdRatio": 1.00,
            "timePlayed": 1.00,
            "gamesPlayed": 1.00,
            "scorePerMinute": 1.00,
            "deaths": 1.00
        }
    },
    "players": {
        "playersToFollow||otherPlayersToFollow": [
            {
                "info": {
                    "inGameName": "[Foo]Bar",
                    "username": "Bar#123456",
                    "platform": "battle",
                    "platformFound": "uno",
                    "team": "one"
                },
                "found": true,
                "gameStatistics": {
                    "kills": 1.00,
                    "kdRatio": 1.00,
                    "score": 1.00,
                    "timePlayed": 1.00,
                    "percentTimeMoving": 1.00,
                    "longestStreak": 1.00,
                    "scorePerMinute": 1.00,
                    "damageDone": 1.00,
                    "distanceTraveled": 1.002,
                    "deaths": 1.00,
                    "damageTaken": 1.00
                },
                "lifetimeStatistics": {
                    "wins": 1.00,
                    "kills": 1.00,
                    "kdRatio": 1.00,
                    "timePlayed": 1.00,
                    "gamesPlayed": 1.00,
                    "scorePerMinute": 1.00,
                    "deaths": 1.00
                }
            },
        ]
    }
}
```
> Example output file with no data.
