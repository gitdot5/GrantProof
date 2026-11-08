import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, extname, parse, resolve } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: npm run demo:voiceover -- --video recording.webm --audio narration.wav [--output final.mp4]",
  );
  process.exit(0);
}

function value(flag) {
  const index = args.indexOf(flag);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--"))
    throw Error(`${flag} needs a file path.`);
  return resolve(args[index + 1]);
}

const video = value("--video");
const voice = value("--audio");
const output = args.includes("--output")
  ? value("--output")
  : resolve(dirname(video), `${parse(video).name}-voiced.mp4`);
for (const input of [video, voice])
  if (!existsSync(input)) throw Error(`File not found: ${input}`);
if (extname(output).toLowerCase() !== ".mp4")
  throw Error("The output must be an .mp4 file.");
if (existsSync(output)) throw Error(`Refusing to overwrite ${output}`);

const command = [
  "-hide_banner", "-loglevel", "error",
  "-i", video, "-i", voice,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-shortest",
  "-movflags", "+faststart", output,
];

await new Promise((done, fail) => {
  const encoder = spawn("ffmpeg", command, { stdio: ["ignore", "ignore", "pipe"] });
  let error = "";
  encoder.stderr.on("data", (chunk) => {
    error = (error + chunk.toString()).slice(-3000);
  });
  encoder.once("error", fail);
  encoder.once("close", (code) =>
    code === 0 ? done() : fail(Error(`FFmpeg failed (${code}). ${error}`)),
  );
});
console.log(`Voiced video: ${output}`);
