import {IndividualMatchResult, Player, TeamMatchesEntry} from "../../../common";

export class WoHelpers {
  static checkIfAllIndividualMatchesAreWO(teamMatch: TeamMatchesEntry): boolean {
    return teamMatch.MatchDetails?.IndividualMatchResults?.every((individualMatchResult: IndividualMatchResult) =>
      (individualMatchResult.IsAwayForfeited && individualMatchResult.IsHomeForfeited) ||
      (
        !Object.hasOwn(individualMatchResult, 'IsAwayForfeited') &&
        !Object.hasOwn(individualMatchResult, 'IsHomeForfeited') &&
        !Object.hasOwn(individualMatchResult, 'HomeSetCount') &&
        !Object.hasOwn(individualMatchResult, 'AwaySetCount')
      )
    ) ?? false;
  }

  static checkIfAllPlayersAreWO(teamMatch: TeamMatchesEntry, team: 'Away' | 'Home'): boolean {
    return teamMatch.MatchDetails?.[team + 'Player']?.Players?.every((player: Player) => player.IsForfeited) ?? false;
  }

}
