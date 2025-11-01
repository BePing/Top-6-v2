import {IndividualMatchResult, Player} from "../../../common";

export class PointsHelper {
  static countForfeitForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResult[],
    oppositePlayer: Player[],
    position: 'Away' | 'Home',
  ): number {
    const oppositePropertyToCheck = position === 'Home' ? 'IsAwayForfeited' : 'IsHomeForfeited';
    const playerPropertyToCheck = position === 'Home' ? 'IsHomeForfeited' : 'IsAwayForfeited';

    const individualMatchesFF = PointsHelper.getIndividualMatchesForPlayer(playerUniqueIndex, individualMatches, position)
      .filter((matchResult: IndividualMatchResult) =>
        matchResult[oppositePropertyToCheck] === true &&
        !matchResult[playerPropertyToCheck],
      ).length;
    const playersFF = oppositePlayer.filter((p) => p.IsForfeited).length;

    return Math.max(individualMatchesFF, playersFF);
  }

  static countVictoriesForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResult[],
    position: 'Away' | 'Home',
  ): number {
    const scoreToCheck = position === 'Home' ? 'HomeSetCount' : 'AwaySetCount';

    return PointsHelper.getIndividualMatchesForPlayer(playerUniqueIndex, individualMatches, position)
      .filter((matchResult: IndividualMatchResult) => matchResult[scoreToCheck] === 3)
      .length;
  }

  static getIndividualMatchesForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResult[],
    currentTeam: 'Away' | 'Home',
  ): IndividualMatchResult[] {
    const playerPropertyArrayToCheck = currentTeam === 'Home' ? `HomePlayerUniqueIndex` : `AwayPlayerUniqueIndex`;

    return individualMatches
      .filter((matchResult: IndividualMatchResult) => matchResult[playerPropertyArrayToCheck]?.includes(playerUniqueIndex));
  }

  static calculatePoints(victories: number, forfeits: number): number {
    return (victories + forfeits) === 4 ? 5 : (victories + forfeits);
  }

}
