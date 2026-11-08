import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const live = args.includes("--live");
const headed = args.includes("--headed");
const outputIndex = args.indexOf("--output");
if (args.includes("--help")) {
  console.log(
    "Usage: npm run demo:record -- [--live] [--headed] [--output path.webm]\n" +
      "Default: isolated fictional data and deterministic fixture generation.",
  );
  process.exit(0);
}
if (outputIndex !== -1 && (!args[outputIndex + 1] || args[outputIndex + 1].startsWith("--")))
  throw Error("--output needs a .webm path.");
const unknown = args.filter(
  (arg, index) =>
    !["--live", "--headed", "--output"].includes(arg) && index !== outputIndex + 1,
);
if (unknown.length) throw Error(`Unknown option: ${unknown.join(", ")}`);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const requested =
  outputIndex === -1
    ? join("demo-output", `grantproof-demo-${stamp}.webm`)
    : args[outputIndex + 1];
const videoPath = isAbsolute(requested) ? requested : resolve(root, requested);
if (!videoPath.endsWith(".webm")) throw Error("The recording output must end in .webm.");
if (existsSync(videoPath)) throw Error(`Refusing to overwrite ${videoPath}`);
const { dir, name } = parse(videoPath);
const reportPath = join(dir, `${name}-report.html`);
const auditPath = join(dir, `${name}-audit.json`);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(Error("Could not choose a loopback port."));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function startApp(database) {
  const buildId = join(root, ".next", "BUILD_ID");
  if (!existsSync(buildId))
    throw Error("Production build missing. Run `npm run build` first.");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const next = join(root, "node_modules", "next", "dist", "bin", "next");
  let log = "";
  const serverEnv = {
    ...process.env,
    GRANTPROOF_DB: database,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  if (!live) serverEnv.OPENAI_API_KEY = "";
  const child = spawn(
    process.execPath,
    [next, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk) => {
      log = (log + chunk.toString()).slice(-6000);
    });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw Error(`GrantProof server exited early.\n${log}`);
    try {
      const response = await fetch(`${base}/api/workspace`);
      if (response.ok) return { child, base, workspace: await response.json() };
    } catch {
      // The server may still be starting.
    }
    await pause(300);
  }
  child.kill("SIGTERM");
  throw Error(`GrantProof did not become ready.\n${log}`);
}

async function launchBrowser() {
  const options = { headless: !headed };
  const channel = process.env.GRANTPROOF_BROWSER_CHANNEL || "chrome";
  try {
    return await chromium.launch({ ...options, channel });
  } catch (error) {
    if (process.env.GRANTPROOF_BROWSER_CHANNEL) throw error;
    console.warn("Google Chrome unavailable; trying Playwright Chromium.");
    return chromium.launch(options);
  }
}

async function record(page, base) {
  const hold = (ms = 2600) => page.waitForTimeout(ms);
  const chapter = async (title, description) => {
    console.log(`Recording: ${title}`);
    await page.screencast.showChapter(title, { description, duration: 2000 });
    await hold(2200);
  };
  const navigate = async (label, heading) => {
    await page.locator("aside nav").getByRole("button", { name: label }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
  };

  await page.goto(`${base}/#dashboard`);
  await expect(page.getByRole("heading", { name: "A clear view of your grant." })).toBeVisible();
  await page.getByLabel("Workspace theme").selectOption("ocean-drive");
  await page.screencast.start({ path: videoPath, size: { width: 1600, height: 900 } });
  await page.screencast.showActions({ position: "bottom-right", duration: 650 });
  try {
    await chapter(
      "GrantProof",
      "Every claim has evidence. Every grant dollar reconciles.",
    );
    await hold();
    const portfolio = page.getByRole("region", { name: "Grant portfolio" });
    await portfolio.scrollIntoViewIfNeeded();
    await chapter("A portfolio of funders", "Each grant has its own dates, budget, and review blockers.");
    await expect(portfolio).toContainText("Family Futures 2026");
    await expect(portfolio).toContainText("Bridge Fund");
    await hold(2500);
    await page.getByRole("button", { name: "Try the demo" }).click();
    await expect(page.getByRole("dialog", { name: "Your three-minute walkthrough" })).toBeVisible();
    await hold();
    await page.getByRole("button", { name: "Start with evidence →" }).click();

    await chapter("1 · Evidence", "Staff approve source facts before drafting.");
    const approvedFact = page.locator(".factrow").filter({
      hasText: "supported 120 families through 360 coaching sessions",
    });
    await approvedFact.scrollIntoViewIfNeeded();
    await expect(approvedFact).toContainText("Approved");
    await hold(3300);
    await page.getByRole("button", { name: "Needs review" }).click();
    const pendingEstimate = page.locator(".factrow").filter({
      hasText: "92% success rate",
    });
    await pendingEstimate.scrollIntoViewIfNeeded();
    await expect(pendingEstimate).toContainText("Pending review");
    await hold(3300);
    await page.getByRole("button", { name: "All facts" }).click();

    await navigate("Dashboard", "A clear view of your grant.");
    const preparation = page.getByRole("region", { name: "Grant workflow preparation" });
    if (live)
      await preparation.getByRole("checkbox", { name: "Use live workflow agent" }).check();
    await preparation.getByRole("button", { name: "Prepare grant for review", exact: true }).click();
    await expect(preparation).toContainText(
      live ? "Workflow agent handoff" : "Fixture workflow handoff",
      { timeout: 180_000 },
    );
    await expect(preparation).toContainText("2 answers prepared");
    await preparation.locator(".preparation-receipt").scrollIntoViewIfNeeded();
    await chapter(
      "2 · Prepare the grant",
      live
        ? "The workflow agent audits evidence and spending, then drafts missing answers."
        : "Fixture preparation audits the grant and drafts two answers without an AI call.",
    );
    await hold(3500);

    await navigate("Application workspace", "Your impact, backed by evidence.");
    await chapter(
      "3 · Sourced answers",
      live ? "Live OpenAI Agents SDK, checked against approved facts." : "Deterministic fixture mode, using approved excerpts only.",
    );
    if (live) {
      await expect(page.locator(".modecard")).toContainText("Live OpenAI");
    } else {
      await expect(page.locator(".modecard")).toContainText("Deterministic fixture");
    }
    const answers = page.locator(".answercard");
    await expect(answers.nth(0).locator(".citation").first()).toBeVisible({ timeout: 90_000 });
    await hold(3300);
    const activity = answers.nth(0).getByRole("region", { name: "Generation activity" });
    await expect(activity).toContainText(live ? "See what the agent did" : "See what the demo ran");
    await activity.scrollIntoViewIfNeeded();
    await chapter(
      "Recorded draft activity",
      live
        ? "See the retrieved facts, funder rules, spending tool, and code validation."
        : "The fixture receipt shows the exact work run and clearly says no AI was called.",
    );
    if (live) {
      await activity.getByText("Tool used", { exact: true }).first().click();
      await hold(2200);
    }
    await activity.getByRole("button", { name: /View evidence/ }).first().click();
    const activityEvidence = page.getByRole("dialog", { name: "Claim evidence" });
    await expect(activityEvidence).toContainText("2026 program register.txt");
    await hold(3300);
    await activityEvidence.getByRole("button", { name: "Close evidence" }).click();
    await expect(answers.nth(1).locator(".citation").first()).toBeVisible({ timeout: 90_000 });
    await answers.nth(1).scrollIntoViewIfNeeded();
    await hold(3000);

    await page.getByRole("combobox", { name: "Current grant" }).selectOption("g2");
    await expect(page.locator(".answercard")).toHaveCount(1);
    await page.locator(".answercard").getByRole("button", { name: "✧ Generate sourced answer" }).click();
    await expect(page.locator(".answercard .gap").first()).toContainText("Evidence gap", { timeout: 90_000 });
    await page.locator(".answercard .gap").first().scrollIntoViewIfNeeded();
    await chapter("Missing evidence stays visible", "An unapproved future goal cannot become a claim.");
    await hold(3500);
    await page.getByRole("combobox", { name: "Current grant" }).selectOption("g1");

    await navigate("Grant spending", "Every dollar, accounted for.");
    await chapter("4 · Spending", "$50,000 budget · $16,200 spent · $33,800 remaining.");
    const totals = page.locator(".money-stats");
    await expect(totals).toContainText("$50,000.00");
    await expect(totals).toContainText("$16,200.00");
    await expect(totals).toContainText("$33,800.00");
    await hold(3800);
    await page.getByRole("button", { name: "↑ Import CSV" }).click();
    await page.getByLabel("CSV file").setInputFiles(join(root, "fixtures", "quickbooks-sample.csv"));
    await expect(page.getByRole("textbox", { name: "CSV contents" })).not.toBeEmpty();
    await page.getByRole("button", { name: "Validate & import" }).click();
    await expect(page.locator(".notice")).toContainText("0 imported · 4 duplicates skipped");
    await hold(4000);
    await page.getByRole("button", { name: "↑ Import CSV" }).click();
    await page.getByRole("combobox", { name: "Current grant" }).selectOption("g2");
    await expect(page.getByText("Inclusive reporting period: 2026-07-01 through 2027-06-30")).toBeVisible();
    await hold(3000);
    await page.getByRole("combobox", { name: "Current grant" }).selectOption("g1");

    await navigate("Review & export", "Ready for a human sign-off.");
    await chapter("5 · Human approval", "The exact application and financial report are sealed together.");
    await expect(page.getByText("✓ All deterministic checks passed")).toBeVisible();
    await hold(2300);
    await page.getByRole("button", { name: "Approve this snapshot" }).click();
    const reportLink = page.getByRole("link", { name: "↓ Download approved report" });
    const auditLink = page.getByRole("link", { name: "↓ Export audit package · JSON" });
    await expect(reportLink).toBeVisible();
    await expect(page.locator(".history code").first()).toContainText(/[a-f0-9]{16}/);
    await hold(3500);
    const [report] = await Promise.all([page.waitForEvent("download"), reportLink.click()]);
    await report.saveAs(reportPath);
    const [audit] = await Promise.all([page.waitForEvent("download"), auditLink.click()]);
    await audit.saveAs(auditPath);
    const packageData = JSON.parse(await readFile(auditPath, "utf8"));
    if (!/^[a-f0-9]{64}$/.test(packageData.approval?.hash || ""))
      throw Error("The downloaded audit package has no valid approval hash.");
    await page.goto(pathToFileURL(reportPath).href);
    await expect(page.getByRole("heading", { name: "Family Futures 2026" })).toBeVisible();
    await chapter("Approved report", "A readable report with linked source excerpts and exact totals.");
    await hold(4500);

    await page.goto(`${base}/#application`);
    await expect(page.getByRole("heading", { name: "Your impact, backed by evidence." })).toBeVisible();
    await page.getByRole("button", { name: "Edit answer" }).first().click();
    const editor = page.getByRole("dialog", { name: "Edit answer" });
    await editor.getByRole("textbox", { name: "Claim 1" }).fill("Tidepath supported 999 families through 360 coaching sessions.");
    await hold(2200);
    await editor.getByRole("button", { name: "Save new version" }).click();
    await expect(editor).toHaveCount(0);
    await navigate("Review & export", "Ready for a human sign-off.");
    await expect(page.getByRole("link", { name: "↓ Export audit package · JSON" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve this snapshot" })).toBeDisabled();
    await page.getByRole("button", { name: "Check export availability" }).click();
    await expect(page.locator(".notice[role='alert']")).toContainText("Export blocked:");
    await chapter("The seal catches the edit", "Unsupported wording invalidates approval and locks export.");
    await hold(5500);
  } finally {
    await page.screencast.stop();
  }
}

let app;
let browser;
const scratch = await mkdtemp(join(tmpdir(), "grantproof-record-"));
try {
  await mkdir(dir, { recursive: true });
  app = await startApp(join(scratch, "demo.sqlite"));
  if (app.workspace.drafts.length || app.workspace.currentApprovals.length)
    throw Error("The isolated demo database was not clean.");
  if (live && !app.workspace.liveAvailable)
    throw Error("--live needs OPENAI_API_KEY in the server environment or .env.local.");
  browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
    reducedMotion: "reduce",
  });
  await record(await context.newPage(), app.base);
  await context.close();
  const video = await stat(videoPath);
  if (video.size < 10_000) throw Error("The recording is unexpectedly small.");
  console.log(`Video: ${videoPath}`);
  console.log(`Approved report: ${reportPath}`);
  console.log(`Audit package: ${auditPath}`);
} finally {
  await browser?.close();
  if (app?.child && app.child.exitCode === null) {
    app.child.kill("SIGTERM");
    await pause(800);
    if (app.child.exitCode === null) app.child.kill("SIGKILL");
  }
  await rm(scratch, { recursive: true, force: true });
}
