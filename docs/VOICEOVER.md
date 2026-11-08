# GrantProof demo voiceover

This is a product narration for the roughly 2:08 automated demo. It tells the story behind the workflow rather than describing each click. The recording uses fictional Tidepath data and deterministic fixture mode, so do not describe this particular recording as a live AI run.

## Ready-to-read script

> For a small nonprofit, reporting impact can take time away from creating it. Program results are scattered across documents, grant spending lives in spreadsheets, and one coordinator has to turn it all into a report a funder can trust.

> Meet GrantProof. It brings evidence, spending, and grant reporting into one workspace, so a team can move from raw records to a reviewable report with confidence.

> GrantProof starts with the source. Staff bring in program records, review the facts they contain, and approve what is ready to use. Each grant keeps its own questions, reporting period, budget, and deadlines. That context matters: a future goal should never be presented as an outcome already achieved.

> When it is time to report, GrantProof prepares the grant for review. It checks the available evidence and spending, then drafts answers grounded in approved facts. Every supported claim points back to the exact source excerpt. A reviewer can trace the answer all the way to the original record.

> And when the evidence is missing? GrantProof shows a gap. It will not turn an unapproved estimate into a confident sounding result. The team knows exactly what needs a human decision before the report can move forward.

> The financial side gets the same care. Import transactions from an accounting CSV, skip duplicates, allocate spending to grant categories, and see what has been spent and what remains. Budget warnings and unallocated transactions surface before approval, while each funder's reporting period stays separate.

> Finally, a person reviews the complete package. Approval seals the report and its financials with a verifiable hash. If an answer changes afterward, that approval is invalidated and export is blocked until the new version is reviewed. The exported report and audit package preserve what was actually approved.

> GrantProof helps small teams spend less time assembling reports and more time serving people. Every claim has evidence. Every grant dollar reconciles. And the final decision stays with the humans responsible for it.

## Produce the narrated video

The current WebM recording has no audio. Record the script above as `.wav`, `.m4a`, or `.mp3`, then combine it with the video:

```sh
npm run demo:voiceover -- --video demo-output/your-recording.webm --audio demo-output/narration.m4a
```

This creates `your-recording-voiced.mp4` beside the video. The helper pads short audio with silence or trims audio that runs beyond the video. It requires FFmpeg. You can use a recorded human voice for the final submission, or synthesize a draft narration with a text-to-speech voice and review its timing before sharing.
