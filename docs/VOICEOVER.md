# Voiceover for the automated demo

The Playwright recording is silent. This narration is written for its roughly 2:08 runtime. Read at a conversational pace, leaving short pauses while chapter cards appear. It describes the default **deterministic fixture** recording accurately; do not call it a live AI run.

## Ready-to-read narration

**0:00–0:15 · Workspace and portfolio**

“GrantProof helps Tidepath, a fictional nonprofit, turn its own records into grant reports. One workspace shows two funders, each with its own reporting dates, budget, and tasks that still need a person.”

**0:15–0:30 · Evidence**

“Here are the original program records. Staff approved the outcome for 120 families. The preliminary 92 percent estimate is still pending, so it stays out of supported answers.”

**0:30–0:45 · Prepare the grant**

“One click prepares the grant for review. This recording uses fixture mode, so no AI call is made. The workflow checks evidence and spending, prepares missing answers, and hands the result to staff.”

**0:45–1:03 · Answers and activity**

“Each answer uses approved source excerpts. Its saved activity receipt shows what ran, including the spending check and draft validation. We can open a source link to see the exact sentence, document, and reporting period.”

**1:03–1:15 · Evidence gap**

“For the second funder, the future goal is not yet approved. GrantProof shows an evidence gap instead of inventing a claim.”

**1:15–1:35 · Reconciled spending**

“The 2026 grant has a 50,000 dollar budget, 16,200 dollars spent, and 33,800 remaining. Reimporting the sample accounting CSV skips four duplicates, leaving those totals unchanged. The second funder uses a different reporting year.”

**1:35–1:50 · Approval and report**

“A human reviewer approves the exact application and financial report. The downloads include a readable report and an audit package sealed with a SHA-256 hash.”

**1:50–2:08 · Edit and export lock**

“Now we change a sourced answer to an unsupported number. Approval is invalidated, the checks flag the wording, and export is blocked. Drafting helps staff move faster; staff still decide what leaves.”

## Add the recorded voice

Record the narration as `.wav`, `.m4a`, or `.mp3`, then run:

```sh
npm run demo:voiceover -- --video demo-output/your-recording.webm --audio demo-output/narration.m4a
```

The command makes `your-recording-voiced.mp4` beside the video. It pads short audio with silence or trims audio that runs past the video. It requires FFmpeg on your PATH. You can also import the WebM and narration into Descript or another editor to adjust timing before exporting. Review the final MP4 before sharing it.
