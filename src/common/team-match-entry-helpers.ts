import {TeamMatchesEntry} from "./tabt-client";

export class TeamMatchEntryHelpers {
  isBye(match: TeamMatchesEntry): boolean {
    return (match.HomeClub === '-' && match.HomeTeam.indexOf('Bye') > -1) || (match.AwayClub === '-' && match.AwayTeam.indexOf('Bye') > -1);
  };
}
