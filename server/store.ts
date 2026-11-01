import fs from "node:fs";
import path from "node:path";
import { defaultProfiles } from "./profiles.js";
import {
  profileSchema,
  settingsSchema,
  type Settings,
  type Profile,
  type Session,
} from "../shared/types.js";
export class Store {
  dir = path.resolve(process.env.CHATPLAY_DATA_DIR || "data");
  settings: Settings = {
    profileId: "platformer",
    parser: "local",
    mode: "democracy",
    input: "playground",
    targetWindow: "",
    overlayTheme: "dark",
    showUsernames: true,
    minConfidence: 0.75,
  };
  profiles: Profile[] = structuredClone(defaultProfiles);
  sessions: Session[] = [];
  constructor() {
    fs.mkdirSync(this.dir, { recursive: true });
    const file = path.join(this.dir, "studio.json");
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      this.settings = settingsSchema.parse(data.settings);
      this.profiles = profileSchema.array().min(1).parse(data.profiles);
      this.sessions = (data.sessions || []).slice(0, 100);
    }
  }
  save() {
    const file = path.join(this.dir, "studio.json");
    fs.writeFileSync(
      file + ".tmp",
      JSON.stringify(
        {
          settings: this.settings,
          profiles: this.profiles,
          sessions: this.sessions,
        },
        null,
        2,
      ),
    );
    fs.renameSync(file + ".tmp", file);
  }
  audit(record: unknown) {
    const file = path.join(this.dir, "audit.jsonl");
    if (fs.existsSync(file) && fs.statSync(file).size > 5_000_000)
      fs.renameSync(file, path.join(this.dir, "audit.previous.jsonl"));
    fs.appendFileSync(file, JSON.stringify(record) + "\n");
  }
}
