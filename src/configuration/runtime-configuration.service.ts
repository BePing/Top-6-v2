import typeFlag from "type-flag";
import {Service} from "typedi";

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

@Service()
export class RuntimeConfigurationService {

  private parsed: RuntimeConfiguration;

  init() {
    this.parsed = typeFlag({
      weeklySummary: {
        type: Boolean,
        default: false,
      },
      playersInTop: {
        type: Number,
        default: 24,
      },
      emails: {
        type: [String],
        default: () => [],
      },
      weekName: {
        type: Number,
        default: 22,
      },
      sendViaEmail: {
        type: Boolean,
        default: false,
      },
      uploadToFirebase: {
        type: Boolean,
        default: false,
      },
      postToFacebook: {
        type: Boolean,
        default: false,
      },
      writeFullDebug: {
        type: Boolean,
        default: true,
      },
      googleJSONCredentialsPath: {
        type: String,
        default: '',
      },
    }).flags;
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

  get googleCredentialsJSONPath(): string {
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
