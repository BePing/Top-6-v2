import {createMock} from "ts-auto-mock";
import {
  DivisionsMatchesIngestionService
} from "../../../ingestion/divisions-matches/divisions-matches-ingestion-service";
import {DivisionsMatchesIngestionModel} from "../../../ingestion/divisions-matches/divisions-matches-ingestion-model";
import {LoggingService, TeamMatchesEntry} from "../../../common";
import {ConfigurationService} from "../../../configuration/configuration.service";
import {ErrorProcessingService} from "../../error-processing-service/error-processing-service";
import {TeamMatchEntryHelpers} from "../../../common/team-match-entry-helpers";
import {PlayersPointsProcessingService} from "./players-points-processing-service";

const matchData = [
  {
    "MatchId": "LgH17/354",
    "WeekName": "17",
    "Date": "2023-02-18T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "L193",
    "HomeClub": "L193",
    "HomeTeam": "St Georges H",
    "AwayClub": "L397",
    "AwayTeam": "Heleping B",
    "NextWeekName": "18",
    "PreviousWeekName": "16",
    "IsHomeForfeited": false,
    "IsAwayForfeited": false,
    "MatchDetails": {
      "DetailsCreated": false,
      "MatchSystem": 2,
      "CommentCount": 0
    },
    "DivisionId": 6478,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": false,
    "IsLocked": false
  },
  {
    "MatchId": "LgH01/135",
    "WeekName": "01",
    "Date": "2022-09-17T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "L323",
    "VenueEntry": {
      "Name": "CTT MINEROIS",
      "Street": "Chapelle des Anges, 68A",
      "Town": "4890 FROIDTHIER",
      "Phone": "087/56.01.61",
      "Comment": "Douches"
    },
    "HomeClub": "L323",
    "HomeTeam": "Minerois D",
    "AwayClub": "L355",
    "AwayTeam": "Ermitage C",
    "Score": "0-0 fg (fg)",
    "MatchUniqueId": 556413,
    "NextWeekName": "02",
    "IsHomeForfeited": true,
    "IsAwayForfeited": true,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 142047,
            "FirstName": "MAXIME",
            "LastName": "JOSKIN",
            "Ranking": "C0",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 132560,
            "FirstName": "JEAN",
            "LastName": "DOME",
            "Ranking": "C2",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 119100,
            "FirstName": "STEPHAN",
            "LastName": "PONTE",
            "Ranking": "C2",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 148221,
            "FirstName": "CLARA",
            "LastName": "CEULEMANS",
            "Ranking": "C4",
            "VictoryCount": 0
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 120444,
            "FirstName": "PHILIPPE",
            "LastName": "CLAESSENS",
            "Ranking": "C2",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 118116,
            "FirstName": "VINCENT",
            "LastName": "NEUFCOURT",
            "Ranking": "C2",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 120453,
            "FirstName": "SALVATORE",
            "LastName": "LIBERT",
            "Ranking": "C2",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 118365,
            "FirstName": "JEAN-LUC",
            "LastName": "GILLAIN",
            "Ranking": "C6",
            "VictoryCount": 0
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            148221
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            118116
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119100
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            120444
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            132560
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            118365
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            142047
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            120453
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            148221
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            120444
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119100
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            118116
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            132560
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            120453
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            142047
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            118365
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            148221
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            120453
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119100
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            118365
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            132560
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            120444
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            142047
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            118116
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            148221
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            118365
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119100
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            120453
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            132560
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            118116
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            142047
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            120444
          ],
          "IsHomeForfeited": true,
          "IsAwayForfeited": true
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 0,
      "AwayScore": 0,
      "CommentCount": 0
    },
    "DivisionId": 6434,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": true,
    "IsValidated": true,
    "IsLocked": true
  },
  {
    "MatchId": "NH01/021",
    "WeekName": "01",
    "Date": "2022-09-17T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "L119",
    "VenueEntry": {
      "Name": "RCTT ASTRID (Salle André Malpas)",
      "Street": "Rue du Doyard, 114",
      "Town": "4040 HERSTAL",
      "Phone": "04/240.17.32",
      "Comment": "Douches"
    },
    "HomeClub": "L119",
    "HomeTeam": "Astrid A",
    "AwayClub": "H001",
    "AwayTeam": "La Villette A",
    "Score": "8-8",
    "MatchUniqueId": 556411,
    "NextWeekName": "02",
    "IsHomeForfeited": false,
    "IsAwayForfeited": false,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomeCaptain": 118048,
      "AwayCaptain": 100064,
      "Referee": 118048,
      "HallCommissioner": 165634,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 165562,
            "FirstName": "VINCENT",
            "LastName": "LENOIR",
            "Ranking": "As18",
            "VictoryCount": 3
          },
          {
            "Position": 2,
            "UniqueIndex": 118048,
            "FirstName": "JULIEN",
            "LastName": "BONIVER",
            "Ranking": "B0",
            "VictoryCount": 1
          },
          {
            "Position": 3,
            "UniqueIndex": 137235,
            "FirstName": "ROMAIN",
            "LastName": "GASPAR",
            "Ranking": "B0",
            "VictoryCount": 3
          },
          {
            "Position": 4,
            "UniqueIndex": 132483,
            "FirstName": "THOMAS",
            "LastName": "CUSTINNE",
            "Ranking": "B2",
            "VictoryCount": 1
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 100011,
            "FirstName": "OLEG",
            "LastName": "DANCHENKO",
            "Ranking": "B0",
            "VictoryCount": 2
          },
          {
            "Position": 2,
            "UniqueIndex": 100064,
            "FirstName": "CHRISTIAN",
            "LastName": "BLONDEAU",
            "Ranking": "B0",
            "VictoryCount": 2
          },
          {
            "Position": 3,
            "UniqueIndex": 147605,
            "FirstName": "XAVIER",
            "LastName": "WATS",
            "Ranking": "B0",
            "VictoryCount": 4
          },
          {
            "Position": 4,
            "UniqueIndex": 149333,
            "FirstName": "CHARLES",
            "LastName": "JANSSENS",
            "Ranking": "B2",
            "VictoryCount": 0
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            132483
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            100064
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-7,2|-9,3|-9"
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            137235
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            100011
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|8,2|9,3|-7,4|-11,5|8"
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118048
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            149333
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|7,3|7"
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            165562
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            147605
          ],
          "HomeSetCount": 2,
          "AwaySetCount": 3,
          "Scores": "1|-8,2|9,3|-15,4|4,5|-7"
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            132483
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            100011
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-5,2|-10,3|-3"
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            137235
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            100064
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|-4,2|2,3|-3,4|10,5|8"
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118048
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            147605
          ],
          "HomeSetCount": 2,
          "AwaySetCount": 3,
          "Scores": "1|-8,2|-9,3|7,4|9,5|-13"
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            165562
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            149333
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|4,2|5,3|4"
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            132483
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            147605
          ],
          "HomeSetCount": 2,
          "AwaySetCount": 3,
          "Scores": "1|5,2|-10,3|-9,4|9,5|-8"
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            137235
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            149333
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|11,2|17,3|5"
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118048
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            100011
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-3,2|-7,3|-7"
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            165562
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            100064
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|9,2|15,3|10"
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            132483
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            149333
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|8,2|7,3|5"
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            137235
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            147605
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|7,2|-9,3|-8,4|-7"
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118048
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            100064
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-2,2|-9,3|-9"
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            165562
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            100011
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|4,2|7,3|3"
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 8,
      "AwayScore": 8,
      "CommentCount": 0
    },
    "DivisionId": 6072,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": true,
    "IsLocked": true
  },
  {
    "MatchId": "NH01/022",
    "WeekName": "01",
    "Date": "2022-09-17T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "LK052",
    "VenueEntry": {
      "Name": "Sportcentrum",
      "Street": "Manestraat, 82/3",
      "Town": "3540 Herk-de-Stad",
      "Phone": "013/33 80 65",
      "Comment": "Geen zwarte zolen of zolen die sporen nalaten, noch sportschoeisel dat buiten werd gedragen. Kleedkamers: 1 dames + 5 heren, douches.\r\nPlaats voor publiek in de speelzaal. Cafetaria afgescheiden van zaal, wedstrijden te volgen."
    },
    "HomeClub": "LK052",
    "HomeTeam": "Schulen A",
    "AwayClub": "L264",
    "AwayTeam": "Tiege A",
    "Score": "8-8",
    "MatchUniqueId": 555971,
    "NextWeekName": "02",
    "IsHomeForfeited": false,
    "IsAwayForfeited": false,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomeCaptain": 507066,
      "AwayCaptain": 119136,
      "Referee": 507039,
      "HallCommissioner": 507066,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 507066,
            "FirstName": "WARD",
            "LastName": "POEL",
            "Ranking": "B0",
            "VictoryCount": 2
          },
          {
            "Position": 2,
            "UniqueIndex": 508859,
            "FirstName": "MAXIM",
            "LastName": "JANIK",
            "Ranking": "B2",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 522440,
            "FirstName": "MATTHIAS",
            "LastName": "VANVINCKENROYE",
            "Ranking": "B2",
            "VictoryCount": 2
          },
          {
            "Position": 4,
            "UniqueIndex": 507064,
            "FirstName": "JAN",
            "LastName": "POEL",
            "Ranking": "B2",
            "VictoryCount": 4
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 117862,
            "FirstName": "JONATHAN",
            "LastName": "JUNIUS",
            "Ranking": "B0",
            "VictoryCount": 3
          },
          {
            "Position": 2,
            "UniqueIndex": 119136,
            "FirstName": "JORDANE",
            "LastName": "LEJEUNE",
            "Ranking": "B0",
            "VictoryCount": 1
          },
          {
            "Position": 3,
            "UniqueIndex": 118159,
            "FirstName": "HERVE",
            "LastName": "DELPORTE",
            "Ranking": "B0",
            "VictoryCount": 2
          },
          {
            "Position": 4,
            "UniqueIndex": 125481,
            "FirstName": "KEVIN",
            "LastName": "LEONARD",
            "Ranking": "B0",
            "VictoryCount": 2
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            507064
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119136
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|10,2|10,3|12"
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            522440
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            117862
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|-6,2|-6,3|8,4|-6"
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            508859
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            125481
          ],
          "HomeSetCount": 2,
          "AwaySetCount": 3,
          "Scores": "1|8,2|-3,3|8,4|-9,5|-7"
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            507066
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            118159
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|-3,2|2,3|-8,4|8,5|7"
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            507064
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            117862
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|6,2|8,3|9"
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            522440
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119136
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 1,
          "Scores": "1|8,2|16,3|-5,4|7"
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            508859
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            118159
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-10,2|-12,3|-9"
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            507066
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            125481
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|-6,2|9,3|-5,4|-4"
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            507064
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            118159
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|-10,2|9,3|-6,4|10,5|6"
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            522440
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            125481
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|9,2|6,3|-1,4|-10,5|9"
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            508859
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            117862
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-3,2|-3,3|-8"
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            507066
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119136
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|6,2|4,3|-9,4|-9,5|6"
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            507064
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            125481
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|6,2|8,3|5"
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            522440
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            118159
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|-10,2|5,3|-7,4|-8"
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            508859
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119136
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-8,2|-8,3|-9"
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            507066
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            117862
          ],
          "HomeSetCount": 0,
          "AwaySetCount": 3,
          "Scores": "1|-10,2|-5,3|-9"
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 8,
      "AwayScore": 8,
      "CommentCount": 0
    },
    "DivisionId": 6072,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": true,
    "IsLocked": true
  },

  {
    "MatchId": "NH04/036",
    "WeekName": "04",
    "Date": "2022-10-15T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "A115",
    "VenueEntry": {
      "Name": "Chalet Karel Sappenberghs TTK Berlaar",
      "Street": "Alpenroosstraat, 26",
      "Town": "2590 Berlaar",
      "Phone": "03/422.51.52",
      "Comment": ""
    },
    "HomeClub": "A115",
    "HomeTeam": "Dylan Berlaar A",
    "AwayClub": "H297",
    "AwayTeam": "R.R. Basecles A",
    "Score": "14-2",
    "MatchUniqueId": 566535,
    "NextWeekName": "05",
    "PreviousWeekName": "03",
    "IsHomeForfeited": false,
    "IsAwayForfeited": false,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomeCaptain": 510873,
      "AwayCaptain": 137632,
      "Referee": 501897,
      "HallCommissioner": 501897,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 510873,
            "FirstName": "JULES",
            "LastName": "D'HOLLANDER",
            "Ranking": "B0",
            "VictoryCount": 4
          },
          {
            "Position": 2,
            "UniqueIndex": 502275,
            "FirstName": "LAUREN",
            "LastName": "ENGHIEN",
            "Ranking": "B0",
            "VictoryCount": 4
          },
          {
            "Position": 3,
            "UniqueIndex": 531010,
            "FirstName": "SIMON MERLIN II",
            "LastName": "EBODE MVILONGO",
            "Ranking": "B0",
            "VictoryCount": 3
          },
          {
            "Position": 4,
            "UniqueIndex": 502074,
            "FirstName": "PHILIPPE",
            "LastName": "MANS",
            "Ranking": "B2",
            "VictoryCount": 3
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 137632,
            "FirstName": "IVAN",
            "LastName": "BOITQUIN",
            "Ranking": "B2",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 154285,
            "FirstName": "THOMAS",
            "LastName": "LARUELLE",
            "Ranking": "B2",
            "VictoryCount": 1
          },
          {
            "Position": 3,
            "UniqueIndex": 125325,
            "FirstName": "ANTOINE",
            "LastName": "DELAITE",
            "Ranking": "B4",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 156621,
            "FirstName": "THOMAS",
            "LastName": "DELOFFE",
            "Ranking": "B4",
            "VictoryCount": 1
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            502074
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            154285
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|-6,2|-4,3|7,4|-6"
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            531010
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            137632
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|8,3|6"
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            502275
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            156621
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|4,2|4,3|6"
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            510873
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            125325
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|5,3|7"
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            502074
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            137632
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|5,2|4,3|10"
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            531010
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            154285
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|9,3|9"
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            502275
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            125325
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|3,2|5,3|7"
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            510873
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            156621
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|5,2|8,3|7"
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            502074
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            125325
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|5,2|4,3|9"
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            531010
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            156621
          ],
          "HomeSetCount": 1,
          "AwaySetCount": 3,
          "Scores": "1|-6,2|-11,3|7,4|-12"
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            502275
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            137632
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|4,3|4"
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            510873
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            154285
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|7,2|10,3|6"
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            502074
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            156621
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|8,2|9,3|-3,4|-9,5|4"
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            531010
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            125325
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 1,
          "Scores": "1|7,2|-8,3|9,4|8"
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            502275
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            154285
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 2,
          "Scores": "1|-8,2|2,3|-9,4|12,5|12"
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            510873
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            137632
          ],
          "HomeSetCount": 3,
          "AwaySetCount": 0,
          "Scores": "1|5,2|3,3|4"
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 14,
      "AwayScore": 2,
      "CommentCount": 0
    },
    "DivisionId": 6073,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": true,
    "IsLocked": true
  },
  {
    "MatchId": "LgH01/344",
    "WeekName": "01",
    "HomeClub": "L387",
    "HomeTeam": "Jehay B",
    "AwayClub": "-",
    "AwayTeam": "Bye 1",
    "MatchUniqueId": 555955,
    "NextWeekName": "02",
    "IsHomeForfeited": false,
    "IsAwayForfeited": true,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 163251,
            "FirstName": "BENJAMIN",
            "LastName": "DIEU",
            "Ranking": "E0",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 133202,
            "FirstName": "DANIELLE",
            "LastName": "VERHAEGHE",
            "Ranking": "E2",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 118657,
            "FirstName": "VINCENZO",
            "LastName": "NONA",
            "Ranking": "E4",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 166695,
            "FirstName": "LAURENT",
            "LastName": "ORBAN",
            "Ranking": "E6",
            "VictoryCount": 0
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 0,
            "UniqueIndex": 0,
            "FirstName": "",
            "LastName": "",
            "Ranking": ""
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            166695
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            118657
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            133202
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            163251
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            166695
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            118657
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            133202
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            163251
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            166695
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            118657
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            133202
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            163251
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            166695
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            118657
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            133202
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            163251
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "IsAwayForfeited": true
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 16,
      "AwayScore": 0,
      "CommentCount": 0
    },
    "DivisionId": 6476,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": true,
    "IsLocked": true
  },
  {
    "MatchId": "LgH05/106",
    "WeekName": "05",
    "Date": "2022-10-22T00:00:00.000Z",
    "Time": "19:00:00",
    "Venue": 1,
    "VenueClub": "L193",
    "VenueEntry": {
      "Name": "Centre Sportif de Verlaine",
      "Street": "rue de la Station 37",
      "Town": "4537 Verlaine",
      "Phone": "042890147",
      "Comment": ""
    },
    "HomeClub": "L193",
    "HomeTeam": "St Georges C",
    "AwayClub": "L264",
    "AwayTeam": "Tiege E",
    "Score": "16-0 ff",
    "MatchUniqueId": 571527,
    "NextWeekName": "06",
    "PreviousWeekName": "04",
    "IsHomeForfeited": false,
    "IsAwayForfeited": true,
    "MatchDetails": {
      "DetailsCreated": true,
      "HomePlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 119161,
            "FirstName": "PIERRE",
            "LastName": "DE  JONG",
            "Ranking": "B6",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 118542,
            "FirstName": "FABRICE",
            "LastName": "GARZE",
            "Ranking": "B6",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 119171,
            "FirstName": "VINCENT",
            "LastName": "CHOISIS",
            "Ranking": "C0",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 101053,
            "FirstName": "DANY",
            "LastName": "WATTIER",
            "Ranking": "C0",
            "VictoryCount": 0
          }
        ]
      },
      "AwayPlayers": {
        "PlayerCount": 4,
        "DoubleTeamCount": 0,
        "Players": [
          {
            "Position": 1,
            "UniqueIndex": 119125,
            "FirstName": "GUILLAUME",
            "LastName": "COMELIAU",
            "Ranking": "B6",
            "VictoryCount": 0
          },
          {
            "Position": 2,
            "UniqueIndex": 119125,
            "FirstName": "GUILLAUME",
            "LastName": "COMELIAU",
            "Ranking": "B6",
            "VictoryCount": 0
          },
          {
            "Position": 3,
            "UniqueIndex": 117996,
            "FirstName": "OLIVIER",
            "LastName": "SIMON",
            "Ranking": "B6",
            "VictoryCount": 0
          },
          {
            "Position": 4,
            "UniqueIndex": 139528,
            "FirstName": "ALEXANDRE",
            "LastName": "DUCLOVEL",
            "Ranking": "C2",
            "VictoryCount": 0
          }
        ]
      },
      "IndividualMatchResults": [
        {
          "Position": 1,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            101053
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 2,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119171
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 3,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118542
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            139528
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 4,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            119161
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            117996
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 5,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            101053
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 6,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119171
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 7,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118542
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            117996
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 8,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            119161
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            139528
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 9,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            101053
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            117996
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 10,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119171
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            139528
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 11,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118542
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 12,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            119161
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 13,
          "HomePlayerMatchIndex": [
            4
          ],
          "HomePlayerUniqueIndex": [
            101053
          ],
          "AwayPlayerMatchIndex": [
            4
          ],
          "AwayPlayerUniqueIndex": [
            139528
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 14,
          "HomePlayerMatchIndex": [
            3
          ],
          "HomePlayerUniqueIndex": [
            119171
          ],
          "AwayPlayerMatchIndex": [
            3
          ],
          "AwayPlayerUniqueIndex": [
            117996
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 15,
          "HomePlayerMatchIndex": [
            2
          ],
          "HomePlayerUniqueIndex": [
            118542
          ],
          "AwayPlayerMatchIndex": [
            2
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        },
        {
          "Position": 16,
          "HomePlayerMatchIndex": [
            1
          ],
          "HomePlayerUniqueIndex": [
            119161
          ],
          "AwayPlayerMatchIndex": [
            1
          ],
          "AwayPlayerUniqueIndex": [
            119125
          ],
          "IsAwayForfeited": true
        }
      ],
      "MatchSystem": 2,
      "HomeScore": 16,
      "AwayScore": 0,
      "CommentCount": 0
    },
    "DivisionId": 6428,
    "DivisionCategory": "MEN_POST_23",
    "IsHomeWithdrawn": false,
    "IsAwayWithdrawn": false,
    "IsValidated": true,
    "IsLocked": true
  }
];
const clubs = [
  "L029",
  "L126",
  "L193",
  "L205",
  "L230",
  "L246",
  "L257",
  "L266",
  "L267",
  "L275",
  "L276",
  "L282",
  "L293",
  "L295",
  "L333",
  "L335",
  "L358",
  "L365",
  "L374",
  "L387",
  "L393",
  "L398",
  "L400",
  "L310",
  "L124",
  "L234",
  "L205",
  "L030",
  "L043",
  "L098",
  "L111",
  "L119",
  "L143",
  "L152",
  "L165",
  "L170",
  "L185",
  "L199",
  "L217",
  "L218",
  "L263",
  "L312",
  "L316",
  "L338",
  "L351",
  "L355",
  "L370",
  "L377",
  "L383",
  "L384",
  "L390",
  "L391",
  "L396",
  "L401",
  "L095",
  "L323",
  "L264",
  "L002",
  "L318",
  "L320",
  "L337",
  "L348",
  "L313",
  "L328",
  "L125",
  "L389",
  "L382",
  "L179",
  "L360",
  "L399",
  "L066",
  "L368",
  "L003",
  "L184",
  "L252",
  "L272",
  "L274",
  "L284",
  "L296",
  "L326",
  "L329",
  "L344",
  "L349",
  "L357",
  "L378",
  "L403"
];

describe('PlayersPointsProcessingService', () => {
  it('shoud process matches', async () => {
    const loggerMock = createMock<LoggingService>();
    const configMock = createMock<ConfigurationService>({
      get allClubsUniqueIndex(): string[] {
        return clubs;
      }
    });
    const errorProcessingService = createMock<ErrorProcessingService>({
      error: jest.fn(),
      warn: jest.fn()
    })
    const divisionsMatchesMock = createMock<DivisionsMatchesIngestionService>({
      get model(): DivisionsMatchesIngestionModel {
        return {matches: matchData as TeamMatchesEntry[]};
      }
    })
    const teamMatchEntryHelpers = new TeamMatchEntryHelpers();

    const service = new PlayersPointsProcessingService(
      divisionsMatchesMock as DivisionsMatchesIngestionService,
      loggerMock,
      errorProcessingService,
      configMock,
      teamMatchEntryHelpers
    );

    await service.process();
    const results = {
      "101053": {
        "name": "WATTIER DANY",
        "club": "L193",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "117862": {
        "name": "JUNIUS JONATHAN",
        "club": "L264",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 3,
            "forfeit": 0,
            "matchId": "NH01/022",
            "matchUniqueId": 555971,
            "level": "NAT_WB",
            "pointsWon": 3
          }
        ]
      },
      "117996": {
        "name": "SIMON OLIVIER",
        "club": "L264",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "118048": {
        "name": "BONIVER JULIEN",
        "club": "L119",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 1,
            "forfeit": 0,
            "matchId": "NH01/021",
            "matchUniqueId": 556411,
            "level": "NAT_WB",
            "pointsWon": 1
          }
        ]
      },
      "118116": {
        "name": "NEUFCOURT VINCENT",
        "club": "L355",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "118159": {
        "name": "DELPORTE HERVE",
        "club": "L264",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 2,
            "forfeit": 0,
            "matchId": "NH01/022",
            "matchUniqueId": 555971,
            "level": "NAT_WB",
            "pointsWon": 2
          }
        ]
      },
      "118365": {
        "name": "GILLAIN JEAN-LUC",
        "club": "L355",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "118542": {
        "name": "GARZE FABRICE",
        "club": "L193",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "118657": {
        "name": "NONA VINCENZO",
        "club": "L387",
        "points": [
          {
            "divisionId": 6476,
            "weekName": 1,
            "victoryCount": 4,
            "forfeit": 0,
            "matchId": "LgH01/344",
            "matchUniqueId": 555955,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "119100": {
        "name": "PONTE STEPHAN",
        "club": "L323",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "119125": {
        "name": "COMELIAU GUILLAUME",
        "club": "L264",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "119136": {
        "name": "LEJEUNE JORDANE",
        "club": "L264",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 1,
            "forfeit": 0,
            "matchId": "NH01/022",
            "matchUniqueId": 555971,
            "level": "NAT_WB",
            "pointsWon": 1
          }
        ]
      },
      "119161": {
        "name": "DE  JONG PIERRE",
        "club": "L193",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "119171": {
        "name": "CHOISIS VINCENT",
        "club": "L193",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "120444": {
        "name": "CLAESSENS PHILIPPE",
        "club": "L355",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "120453": {
        "name": "LIBERT SALVATORE",
        "club": "L355",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "125481": {
        "name": "LEONARD KEVIN",
        "club": "L264",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 2,
            "forfeit": 0,
            "matchId": "NH01/022",
            "matchUniqueId": 555971,
            "level": "NAT_WB",
            "pointsWon": 2
          }
        ]
      },
      "132483": {
        "name": "CUSTINNE THOMAS",
        "club": "L119",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 1,
            "forfeit": 0,
            "matchId": "NH01/021",
            "matchUniqueId": 556411,
            "level": "NAT_WB",
            "pointsWon": 1
          }
        ]
      },
      "132560": {
        "name": "DOME JEAN",
        "club": "L323",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "133202": {
        "name": "VERHAEGHE DANIELLE",
        "club": "L387",
        "points": [
          {
            "divisionId": 6476,
            "weekName": 1,
            "victoryCount": 4,
            "forfeit": 0,
            "matchId": "LgH01/344",
            "matchUniqueId": 555955,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "137235": {
        "name": "GASPAR ROMAIN",
        "club": "L119",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 3,
            "forfeit": 0,
            "matchId": "NH01/021",
            "matchUniqueId": 556411,
            "level": "NAT_WB",
            "pointsWon": 3
          }
        ]
      },
      "139528": {
        "name": "DUCLOVEL ALEXANDRE",
        "club": "L264",
        "points": [
          {
            "divisionId": 6428,
            "weekName": 5,
            "victoryCount": 0,
            "forfeit": 0,
            "matchId": "LgH05/106",
            "matchUniqueId": 571527,
            "level": "NAT_WB",
            "pointsWon": 0
          }
        ]
      },
      "142047": {
        "name": "JOSKIN MAXIME",
        "club": "L323",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "148221": {
        "name": "CEULEMANS CLARA",
        "club": "L323",
        "points": [
          {
            "divisionId": 6434,
            "weekName": 1,
            "victoryCount": 0,
            "forfeit": 4,
            "matchId": "LgH01/135",
            "matchUniqueId": 556413,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "163251": {
        "name": "DIEU BENJAMIN",
        "club": "L387",
        "points": [
          {
            "divisionId": 6476,
            "weekName": 1,
            "victoryCount": 4,
            "forfeit": 0,
            "matchId": "LgH01/344",
            "matchUniqueId": 555955,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      },
      "165562": {
        "name": "LENOIR VINCENT",
        "club": "L119",
        "points": [
          {
            "divisionId": 6072,
            "weekName": 1,
            "victoryCount": 3,
            "forfeit": 0,
            "matchId": "NH01/021",
            "matchUniqueId": 556411,
            "level": "NAT_WB",
            "pointsWon": 3
          }
        ]
      },
      "166695": {
        "name": "ORBAN LAURENT",
        "club": "L387",
        "points": [
          {
            "divisionId": 6476,
            "weekName": 1,
            "victoryCount": 4,
            "forfeit": 0,
            "matchId": "LgH01/344",
            "matchUniqueId": 555955,
            "level": "NAT_WB",
            "pointsWon": 5
          }
        ]
      }
    };

    expect(service.model).toEqual(results);
  })
  it('should skip players if in exclusion list', () => {

  })

})
