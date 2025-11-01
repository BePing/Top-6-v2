import {TeamMatchesEntryDTO} from "./tabt-client";

export class TeamMatchEntryHelpers {
  isBye(match: TeamMatchesEntryDTO): boolean {
    return (match.homeClub === '-' && match.homeTeam.indexOf('Bye') > -1) || (match.awayClub === '-' && match.awayTeam.indexOf('Bye') > -1);
  };
}
