import {ProcessingServiceContract} from "../../processing-service-contract";
import {
  DivisionsMatchesIngestionService,
} from "../../../ingestion/divisions-matches/divisions-matches-ingestion-service";
import {LoggingService, Maybe, PlayerDTO, TeamMatchesEntryDTO} from "../../../common";
import {ConfigurationService} from "../../../configuration/configuration.service";
import {TeamMatchEntryHelpers} from "../../../common/team-match-entry-helpers";
import {PlayerPoint, PlayerPoints, PlayersPointsProcessingModel} from "./players-points-processing-model";
import {ErrorProcessingService} from "../../error-processing-service/error-processing-service";
import {WoHelpers} from "./wo-helpers";
import {PointsHelper} from "./points-helper";
import {PlayerPointsOverrides} from '../../../configuration/configuration.model';

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

    // Safety check for the ingestion model
    const ingestionModel = this.divisionsMatchesIngestionService.model;
    if (!ingestionModel) {
      this.loggingService.error('Divisions matches ingestion model is undefined. Cannot process player points.');
      return;
    }

    const matches = ingestionModel.matches;
    if (!matches) {
      this.loggingService.error('Matches array is undefined in ingestion model. Cannot process player points.');
      return;
    }

    this.loggingService.info(`Processing ${matches.length} matches for player points...`);
    const clubs = this.configurationService.allClubsUniqueIndex;

    for (const match of matches) {
      if (this.teamMatchEntryHelpers.isBye(match)) {
        this.handleByeMatch(match);
        continue;
      }

      if (!match.score) {
        continue;
      }

      const teamToCheck = [];
      if (clubs.includes(match.homeClub)) {
        teamToCheck.push('Home');
      }
      if (clubs.includes(match.awayClub)) {
        teamToCheck.push('Away');
      }

      for (const currentTeam of teamToCheck) {
        const oppositeTeam = currentTeam === 'Home' ? 'Away' : 'Home';
        if (match.score.includes('sm')) {
          this.handleSmMatch(match, currentTeam)
          continue;
        }

        // At this point
        // SM
        // currentTeam not withdrawn

        const isOppositeForfeited = oppositeTeam === 'Home' ? match.isHomeForfeited : match.isAwayForfeited;
        const isCurrentWithdrawn = currentTeam === 'Home' ? match.isHomeWithdrawn : match.isAwayWithdrawn;
        const isOppositeWithdrawn = oppositeTeam === 'Home' ? match.isHomeWithdrawn : match.isAwayWithdrawn;

        if (
          isOppositeForfeited &&
          (!isCurrentWithdrawn || (isCurrentWithdrawn && isOppositeWithdrawn)) &&
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

  private handleByeMatch(match: TeamMatchesEntryDTO): void {
    const players = (match.homeClub === '-' && match.homeTeam.indexOf('Bye') > -1) ?
      match.matchDetails?.awayPlayers?.players ?? [] :
      match.matchDetails?.homePlayers?.players ?? [];
    const club = (match.homeClub === '-' && match.homeTeam.indexOf('Bye') > -1) ? match.awayClub : match.homeClub;
    for (const player of players) {
      const name = `${player.lastName} ${player.firstName}`;
      this.addMatchToPlayer(player.uniqueIndex, name, club, match.divisionId, Number(match.weekName), match.matchId, match.matchUniqueId, 4, 0);
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
    const uniqueIndexString = uniqueIndex.toString();
    if (!this.model[uniqueIndexString]) {
      this._model[uniqueIndexString] = {
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
          this.errorProcessingService.warn(`${playerName} (ID : ${uniqueIndex}) a été enregistré plusieurs fois sur la feuille de match ${checkAlreadyExistingPoint.matchId}. Seule une participation a été comptabilisée`);
        } else {
          this.errorProcessingService.error(`${playerName} (ID : ${uniqueIndex}) a été enregistré sur deux feuilles de match différentes lors de la semaine ${weekName}. Match 1 :  ${checkAlreadyExistingPoint.matchId}, Match 2 : ${matchId}. Veuillez noter que la participation de ${playerName} pour le match ${matchId} a été exclu de notre calcul.`)
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

  private handleForfeitedMatch(match: TeamMatchesEntryDTO, currentTeam: string): void {
    const teamKey = currentTeam === 'Home' ? 'homePlayers' : 'awayPlayers';
    const clubKey = currentTeam === 'Home' ? 'homeClub' : 'awayClub';
    const players: PlayerDTO[] = match.matchDetails?.[teamKey]?.players ?? [];
    for (const player of players) {
      this.addMatchToPlayer(
        player.uniqueIndex,
        player.lastName + ' ' + player.firstName,
        match[clubKey],
        match.divisionId,
        Number(match.weekName),
        match.matchId,
        match.matchUniqueId,
        0,
        4,
      );
    }

  }

  private handleMatch(match: TeamMatchesEntryDTO, currentTeam: 'Away' | 'Home'): void {
    const teamKey = currentTeam === 'Home' ? 'homePlayers' : 'awayPlayers';
    const clubKey = currentTeam === 'Home' ? 'homeClub' : 'awayClub';
    const opposite = currentTeam === 'Home' ? 'Away' : 'Home';
    const oppositeTeamKey = opposite === 'Home' ? 'homePlayers' : 'awayPlayers';
    const players: PlayerDTO[] = match.matchDetails?.[teamKey]?.players ?? [];
    for (const player of players) {
      // If a player is in an exclusion list, skip it
      if (this.configurationService.isPlayerExcluded(player.uniqueIndex)) {
        this.loggingService.info(`Player ${player.lastName} ${player.firstName} is excluded from points calculation`);
        continue;
      }

      const victories = PointsHelper.countVictoriesForPlayer(player.uniqueIndex, match.matchDetails?.individualMatchResults ?? [], currentTeam);
      const forfeit = PointsHelper.countForfeitForPlayer(
        player.uniqueIndex,
        match.matchDetails?.individualMatchResults ?? [],
        match.matchDetails?.[oppositeTeamKey]?.players ?? [],
        currentTeam);
      this.addMatchToPlayer(
        player.uniqueIndex,
        player.lastName + ' ' + player.firstName,
        match[clubKey],
        match.divisionId,
        Number(match.weekName),
        match.matchId,
        match.matchUniqueId,
        victories,
        forfeit,
      )
    }
  }
  getPlayerResultsUntilWeekName(uniqueIndex: string, weekName: number): PlayerPoints {
    const playerPoints = this.model[uniqueIndex];
    const pointsForWeekname: PlayerPoint[] = playerPoints.points.filter((playerPoint) => playerPoint.weekName <= weekName);
    return {
      ...playerPoints,
      points: pointsForWeekname,
    }
  }

  private handleSmMatch(match: TeamMatchesEntryDTO, currentTeam: string): void {
    // Score modified by an Administrator. Bad aligment or so
    const scores = match.score?.match(/^([0-9]{1,2})-([0-9]{1,2})/);
    if (!scores) return;
    const positionScore = Number(currentTeam === 'Home' ? scores[1] : scores[2]);
    const oppositeScore = Number(currentTeam === 'Home' ? scores[2] : scores[1]);
    const teamKey = currentTeam === 'Home' ? 'homePlayers' : 'awayPlayers';
    const clubKey = currentTeam === 'Home' ? 'homeClub' : 'awayClub';
    const players: PlayerDTO[] = match.matchDetails?.[teamKey]?.players ?? [];

    //Check if the results of the position team is the best score possible
    if (positionScore === (positionScore + oppositeScore)) {
      for (const player of players) {
        // Note: PlayerDTO doesn't have mutable VictoryCount, so we skip setting it
        this.addMatchToPlayer(
          player.uniqueIndex,
          player.lastName + ' ' + player.firstName,
          match[clubKey],
          match.divisionId,
          Number(match.weekName),
          match.matchId,
          match.matchUniqueId,
          0,
          4,
        );
      }

      return;
    } else {
      if (positionScore !== 0) {
        this.loggingService.warn(`Le match ${match.matchId} a un score modifié, mais le score n'est pas le score maximum de défaite. Aucune décision prise pour le top6.`);
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
