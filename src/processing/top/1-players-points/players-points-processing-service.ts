import {Service} from "typedi";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {
  DivisionsMatchesIngestionService,
} from "../../../ingestion/divisions-matches/divisions-matches-ingestion-service";
import {LoggingService, Maybe, Player, TeamMatchesEntry} from "../../../common";
import {ConfigurationService} from "../../../configuration/configuration.service";
import {TeamMatchEntryHelpers} from "../../../common/team-match-entry-helpers";
import {PlayerPoint, PlayersPointsProcessingModel} from "./players-points-processing-model";
import {ErrorProcessingService} from "../../error-processing-service/error-processing-service";
import {WoHelpers} from "./wo-helpers";
import {PointsHelper} from "./points-helper";
import {PlayerPointsOverrides} from '../../../configuration/configuration.model';

@Service()
export class PlayersPointsProcessingService implements ProcessingServiceContract<PlayersPointsProcessingModel> {
  private _model: PlayersPointsProcessingModel;

  constructor(
    private readonly divisionsMatchesIngestionService: DivisionsMatchesIngestionService,
    private readonly loggingService: LoggingService,
    private readonly errorProcessingService: ErrorProcessingService,
    private readonly configurationService: ConfigurationService,
    private readonly teamMatchEntryHelpers: TeamMatchEntryHelpers,
  ) {
  }

  get model(): PlayersPointsProcessingModel {
    return this._model;
  }

  async process(): Promise<void> {
    this.loggingService.info(`Processing all matches for players points...`);
    this._model = {}
    const matches = this.divisionsMatchesIngestionService.model.matches;
    const clubs = this.configurationService.allClubsUniqueIndex;

    for (const match of matches) {
      if (this.teamMatchEntryHelpers.isBye(match)) {
        this.handleByeMatch(match);
        continue;
      }

      if (!match.Score) {
        continue;
      }

      const teamToCheck = [];
      if (clubs.includes(match.HomeClub)) {
        teamToCheck.push('Home');
      }
      if (clubs.includes(match.AwayClub)) {
        teamToCheck.push('Away');
      }

      for (const currentTeam of teamToCheck) {
        const oppositeTeam = currentTeam === 'Home' ? 'Away' : 'Home';
        if (match.Score.includes('sm')) {
          this.handleSmMatch(match, currentTeam)
          continue;
        }

        // At this point
        // SM
        // currentTeam not withdrawn

        if (
          match[`Is${oppositeTeam}Forfeited`] &&
          (!match[`Is${currentTeam}Withdrawn`] || (match[`Is${currentTeam}Withdrawn`] && match[`Is${oppositeTeam}Withdrawn`])) &&
          (WoHelpers.checkIfAllIndividualMatchesAreWO(match) || WoHelpers.checkIfAllPlayersAreWO(match, oppositeTeam))
        ) {
          // Match hasn't been played
          this.handleForfeitedMatch(match, currentTeam);
          continue;
        }

        this.handleMatch(match, currentTeam);
      }
    }
    this.applyPointsOverrides();
  }

  private handleByeMatch(match: TeamMatchesEntry): void {
    const players = (match.HomeClub === '-' && match.HomeTeam.indexOf('Bye') > -1) ?
      match.MatchDetails?.AwayPlayers?.Players ?? [] :
      match.MatchDetails?.HomePlayers?.Players ?? [];
    const club = (match.HomeClub === '-' && match.HomeTeam.indexOf('Bye') > -1) ? match.AwayClub : match.HomeClub;
    for (const player of players) {
      const name = `${player.LastName} ${player.FirstName}`;
      this.addMatchToPlayer(player.UniqueIndex, name, club, match.DivisionId, Number(match.WeekName), match.MatchId, match.MatchUniqueId, 4, 0);
    }
  }

  private addMatchToPlayer(
    uniqueIndex: number,
    playerName: string,
    club: string,
    divisionId: number,
    weekName: number,
    matchId: string,
    matchUniqueId: number,
    victoryCount = 0,
    forfeit = 0,
    override = false) {

    // Happens for FF FG
    if (uniqueIndex === 0) {
      return;
    }

    if (!this.model[uniqueIndex]) {
      this._model[uniqueIndex] = {
        name: playerName,
        club: club,
        points: [],
      }
    }

    const checkAlreadyExistingPointIndex: number = this.model[uniqueIndex].points.findIndex((p) => p.weekName === weekName);
    const checkAlreadyExistingPoint: Maybe<PlayerPoint> = this.model[uniqueIndex].points[checkAlreadyExistingPointIndex];
    if (checkAlreadyExistingPoint) {
      if (override) {
        if (forfeit) {
          this.loggingService.info(`Overriding forfeit of ${this.model[uniqueIndex].name}. Weekname: ${weekName}. Setting forfeit to ${forfeit}.`)
          this._model[uniqueIndex].points[checkAlreadyExistingPointIndex].forfeit = forfeit;
        }
        if (victoryCount) {
          this.loggingService.info(`Overriding victory of ${this.model[uniqueIndex].name}. Weekname: ${weekName}. Setting victory to ${victoryCount}.`)
          this._model[uniqueIndex].points[checkAlreadyExistingPointIndex].victoryCount = victoryCount;
        }
        this._model[uniqueIndex].points[checkAlreadyExistingPointIndex].pointsWon = PointsHelper.calculatePoints(
          this._model[uniqueIndex].points[checkAlreadyExistingPointIndex].victoryCount,
          this._model[uniqueIndex].points[checkAlreadyExistingPointIndex].forfeit
        );
      } else {
        if (checkAlreadyExistingPoint.matchId === matchId) {
          this.errorProcessingService.warn(`${playerName} ${uniqueIndex} est inscrit plusieurs fois sur la feuille de match ${checkAlreadyExistingPoint.matchId}. Une seule participation est comptabilisée`)
        } else {
          this.errorProcessingService.error(`${playerName} ${uniqueIndex} a été inscrit sur deux feuilles de match différentes à la semaine ${weekName}. Match 1 : ${checkAlreadyExistingPoint.matchId}, Match2 : ${matchId}. Le match ${matchId} est ignoré`)
        }
      }
      return;
    }

    const newPlayerPoint: PlayerPoint = {
      divisionId,
      weekName,
      victoryCount,
      forfeit,
      matchId,
      matchUniqueId,
      level: this.configurationService.getLevelForDivision(divisionId),
      pointsWon: PointsHelper.calculatePoints(victoryCount, forfeit),
    }

    this._model[uniqueIndex].points.push(newPlayerPoint)
  }

  private handleForfeitedMatch(match: TeamMatchesEntry, currentTeam: string): void {
    const players: Player[] = match.MatchDetails?.[currentTeam + 'Players']?.Players ?? [];
    for (const player of players) {
      this.addMatchToPlayer(
        player.UniqueIndex,
        player.LastName + ' ' + player.FirstName,
        match[currentTeam + 'Club'],
        match.DivisionId,
        Number(match.WeekName),
        match.MatchId,
        match.MatchUniqueId,
        0,
        4,
      );
    }

  }

  private handleMatch(match: TeamMatchesEntry, currentTeam: 'Away' | 'Home'): void {
    const players: Player[] = match.MatchDetails?.[currentTeam + 'Players']?.Players ?? [];
    const opposite = currentTeam === 'Home' ? 'Away' : 'Home';
    for (const player of players) {
      // If a player is in an exclusion list, skip it
      if (this.configurationService.isPlayerExcluded(player.UniqueIndex)) {
        this.loggingService.info(`Player ${player.LastName} ${player.FirstName} is excluded from points calculation`);
        continue;
      }

      const victories = PointsHelper.countVictoriesForPlayer(player.UniqueIndex, match.MatchDetails?.IndividualMatchResults ?? [], currentTeam);
      const forfeit = PointsHelper.countForfeitForPlayer(
        player.UniqueIndex,
        match.MatchDetails?.IndividualMatchResults ?? [],
        match.MatchDetails[`${opposite}Players`].Players ?? [],
        currentTeam);
      this.addMatchToPlayer(
        player.UniqueIndex,
        player.LastName + ' ' + player.FirstName,
        match[currentTeam + 'Club'],
        match.DivisionId,
        Number(match.WeekName),
        match.MatchId,
        match.MatchUniqueId,
        victories,
        forfeit,
      )
    }
  }

  private handleSmMatch(match: TeamMatchesEntry, currentTeam: string): void {
    // Score modified by an Administrator. Bad aligment or so
    const scores = match.Score.match(/^([0-9]{1,2})-([0-9]{1,2})/);
    const positionScore = Number(currentTeam === 'Home' ? scores[1] : scores[2]);
    const oppositeScore = Number(currentTeam === 'Home' ? scores[2] : scores[1]);
    const players: Player[] = match.MatchDetails?.[currentTeam + 'Players']?.Players ?? [];

    //Check if the results of the position team is the best score possible
    if (positionScore === (positionScore + oppositeScore)) {
      for (const player of players) {
        player.VictoryCount = 0;
        this.addMatchToPlayer(
          player.UniqueIndex,
          player.LastName + ' ' + player.FirstName,
          match[currentTeam + 'Club'],
          match.DivisionId,
          Number(match.WeekName),
          match.MatchId,
          match.MatchUniqueId,
          0,
          4,
        );
      }

      return;
    } else {
      if (positionScore !== 0) {
        this.loggingService.warn(`Le match ${match.MatchId} a un score modifié, mais le score n'est pas le score maximum de défaite. Aucune décision prise pour le top6.`);
      }
    }
  }

  private applyPointsOverrides(): void {
    const pointsOverrides: PlayerPointsOverrides = this.configurationService.pointsOverride;
    for (const [playerUniqueIndex, points] of Object.entries(pointsOverrides)) {
      for (const point of points) {
        this.addMatchToPlayer(
          Number(playerUniqueIndex),
          "NA",
          "NA",
          0,
          point.weekName,
          "NA",
          0,
          point.victoryCount,
          point.forfeit,
          true,
        );
      }
    }
  }
}
