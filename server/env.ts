import dotenv from "dotenv";
// Keep machine environment authoritative; local overrides the shared .env file.
dotenv.config({
  path: [".env.local", "env.local", "../.env.local", "../env.local", ".env"],
  quiet: true,
});
