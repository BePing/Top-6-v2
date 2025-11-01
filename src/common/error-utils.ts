/**
 * Error handling utilities for API calls
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    if (errorObj.response?.data?.message) {
      return errorObj.response.data.message;
    }
    if (errorObj.message) {
      return errorObj.message;
    }
  }
  return 'Unknown error';
}

export function extractErrorStatus(error: unknown): string | number {
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    if (errorObj.response?.status) {
      return errorObj.response.status;
    }
  }
  return 'N/A';
}

export function extractErrorData(error: unknown): any {
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    return errorObj.response?.data;
  }
  return null;
}

/**
 * Type guards for DTO types
 */
export function isClubDto(club: unknown): club is import('./tabt-client').ClubDto {
  return (
    typeof club === 'object' &&
    club !== null &&
    'uniqueIndex' in club &&
    'name' in club &&
    'longName' in club
  );
}

export function isTeamMatchesEntryDTO(match: unknown): match is import('./tabt-client').TeamMatchesEntryDTO {
  return (
    typeof match === 'object' &&
    match !== null &&
    'matchId' in match &&
    'weekName' in match &&
    'homeClub' in match &&
    'awayClub' in match
  );
}

export function isDivisionEntryDtoV1(division: unknown): division is import('./tabt-client').DivisionEntryDtoV1 {
  return (
    typeof division === 'object' &&
    division !== null &&
    'DivisionId' in division &&
    'Level' in division
  );
}

