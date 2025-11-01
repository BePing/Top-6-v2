import {IndividualMatchResultDTO, PlayerDTO, TeamMatchesEntryDTO} from "../../../common";

export class WoHelpers {
  static checkIfAllIndividualMatchesAreWO(teamMatch: TeamMatchesEntryDTO): boolean {
    return teamMatch.matchDetails?.individualMatchResults?.every((individualMatchResult: IndividualMatchResultDTO) =>
      (individualMatchResult.isAwayForfeited && individualMatchResult.isHomeForfeited) ||
      (
        !Object.hasOwn(individualMatchResult, 'isAwayForfeited') &&
        !Object.hasOwn(individualMatchResult, 'isHomeForfeited') &&
        !Object.hasOwn(individualMatchResult, 'homeSetCount') &&
        !Object.hasOwn(individualMatchResult, 'awaySetCount')
      )
    ) ?? false;
  }

  static checkIfAllPlayersAreWO(teamMatch: TeamMatchesEntryDTO, team: 'Away' | 'Home'): boolean {
    const teamKey = team === 'Away' ? 'awayPlayers' : 'homePlayers';
    return teamMatch.matchDetails?.[teamKey]?.players?.every((player: PlayerDTO) => player.isForfeited) ?? false;
  }

}
