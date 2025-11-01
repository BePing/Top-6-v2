export interface RuntimeConfiguration {
  weeklySummary: boolean;
  playersInTop: number;
  emails: string[];
  weekName: number;
  sendViaEmail: boolean;
  uploadToFirebase: boolean;
  postToFacebook: boolean;
  writeFullDebug: boolean;
  googleJSONCredentialsPath: string;
}

export class RuntimeConfigurationService {

  private parsed: RuntimeConfiguration;

  init() {
    this.parsed = {
      weeklySummary: process.env.WEEKLY_SUMMARY === 'true',
      playersInTop: parseInt(process.env.PLAYERS_IN_TOP || '24', 10),
      emails: process.env.EMAILS ? process.env.EMAILS.split(',').map(email => email.trim()) : [],
      weekName: parseInt(process.env.WEEK_NAME || '22', 10),
      sendViaEmail: process.env.SEND_VIA_EMAIL === 'true',
      uploadToFirebase: process.env.UPLOAD_TO_FIREBASE === 'true',
      postToFacebook: process.env.POST_TO_FACEBOOK === 'true',
      writeFullDebug: process.env.WRITE_FULL_DEBUG !== 'false',
      googleJSONCredentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS || '',
    };
  }

  override(config: Partial<RuntimeConfiguration>): void {
    this.parsed = {...this.parsed, ...config};
  }

  get weeklySummary(): boolean {
    return this.parsed.weeklySummary;
  }

  get weekName(): number {
    return this.parsed.weekName;
  }

  get sendViaEmail(): boolean {
    return this.parsed.sendViaEmail;
  }

  get uploadToFirebase(): boolean {
    return this.parsed.uploadToFirebase;
  }

  set uploadToFirebase(upload: boolean) {
    this.parsed.uploadToFirebase = upload;
  }

  get googleJSONCredentialsPath(): string {
    return this.parsed.googleJSONCredentialsPath;
  }

  get emails(): string[] {
    return this.parsed.emails;
  }

  get postToFacebook(): boolean {
    return this.parsed.postToFacebook;
  }

  set postToFacebook(post: boolean) {
    this.parsed.postToFacebook = post;
  }

  get playersInTop(): number {
    return this.parsed.playersInTop;
  }

  get writeFullDebug(): boolean {
    return this.parsed.writeFullDebug;
  }
}
