import {IndividualMatchResultDTO, PlayerDTO} from "../../../common";

export class PointsHelper {
  static countForfeitForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResultDTO[],
    oppositePlayer: PlayerDTO[],
    position: 'Away' | 'Home',
  ): number {
    const oppositePropertyToCheck = position === 'Home' ? 'isAwayForfeited' : 'isHomeForfeited';
    const playerPropertyToCheck = position === 'Home' ? 'isHomeForfeited' : 'isAwayForfeited';

    const individualMatchesFF = PointsHelper.getIndividualMatchesForPlayer(playerUniqueIndex, individualMatches, position)
      .filter((matchResult: IndividualMatchResultDTO) =>
        matchResult[oppositePropertyToCheck] === true &&
        !matchResult[playerPropertyToCheck],
      ).length;
    const playersFF = oppositePlayer.filter((p) => p.isForfeited).length;

    return Math.max(individualMatchesFF, playersFF);
  }

  static countVictoriesForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResultDTO[],
    position: 'Away' | 'Home',
  ): number {
    const scoreToCheck = position === 'Home' ? 'homeSetCount' : 'awaySetCount';

    return PointsHelper.getIndividualMatchesForPlayer(playerUniqueIndex, individualMatches, position)
      .filter((matchResult: IndividualMatchResultDTO) => matchResult[scoreToCheck] === 3)
      .length;
  }

  static getIndividualMatchesForPlayer(
    playerUniqueIndex: number,
    individualMatches: IndividualMatchResultDTO[],
    currentTeam: 'Away' | 'Home',
  ): IndividualMatchResultDTO[] {
    const playerPropertyArrayToCheck = currentTeam === 'Home' ? 'homePlayerUniqueIndex' : 'awayPlayerUniqueIndex';

    return individualMatches
      .filter((matchResult: IndividualMatchResultDTO) => matchResult[playerPropertyArrayToCheck]?.includes(playerUniqueIndex));
  }

  static calculatePoints(victories: number, forfeits: number): number {
    return (victories + forfeits) === 4 ? 5 : (victories + forfeits);
  }

}
