import type { Profile } from "../shared/types.js";
const base = {
  maxDurationMs: 700,
  maxRepeat: 3,
  userCooldownMs: 2000,
  globalCooldownMs: 350,
  voteWindowMs: 4000,
};
export const defaultProfiles: Profile[] = [
  {
    ...base,
    id: "platformer",
    name: "Pixel Summit",
    genre: "Platformer",
    description: "Climb together. Move, jump, and find your way to the summit.",
    allowedKeys: ["left", "right", "space", "up", "down"],
    aliases: {
      jump: "space",
      hop: "space",
      leap: "space",
      left: "left",
      right: "right",
      up: "up",
      down: "down",
    },
  },
  {
    ...base,
    id: "racing",
    name: "Community Grand Prix",
    genre: "Racing",
    description: "Let chat take the wheel. Throttle, steer, and brake.",
    allowedKeys: ["w", "a", "s", "d", "space"],
    aliases: {
      accelerate: "w",
      forward: "w",
      throttle: "w",
      left: "a",
      right: "d",
      brake: "s",
      reverse: "s",
      handbrake: "space",
    },
  },
  {
    ...base,
    id: "puzzle",
    name: "Puzzle Party",
    genre: "Puzzle",
    description:
      "A little collective thinking. Directional controls and interaction.",
    allowedKeys: ["left", "right", "up", "down", "e", "z", "r"],
    aliases: {
      left: "left",
      right: "right",
      up: "up",
      down: "down",
      interact: "e",
      undo: "z",
      restart: "r",
    },
  },
];
