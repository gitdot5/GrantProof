# GrantProof submission package

Project: **GrantProof**  
Challenge: **6 — Grant applications and reports**  
Repository: https://github.com/gitdot5/GrantProof  
Tagline: **Let agents prepare. Let people approve.**

## Video

[Download the three-minute MP4](GrantProof-Miami-3min-pitch.mp4?raw=true)

The final narrated Miami civic-startup pitch is 3:00, 1920×1080, H.264 with AAC audio. The media manifest records its checksum. [Submission description](description.md) and [narration transcript](narration.txt) are included.

- 0:00–0:38: Miami mission and fictional challenge problem.
- 0:38–1:36: recorded fixture workflow, duplicate CSV protection, staff package approval, and export lock after an edit.
- 1:36–2:03: recorded live OpenAI drafting tools and original evidence.
- 2:03–2:15: saved live coordinator receipt, not a newly executing run.
- 2:15–2:35: portfolio and optional background worker; an awake Studio and running worker are required.
- 2:35–3:00: proposed pilot, prototype limits, and closing.

The video uses fictional records. The pilot is a proposal, not an existing city partnership. Savings have not been measured. The scheduler is described in the pitch; its execution was verified separately. The original clips do not show a new fact-approval click or a complete missing-evidence generation sequence.

## Verified application version

Application commit `dea9232dececd618e85991b487118e0e1b81ecaf` includes the scheduler from PR #10. Typecheck and build passed, with 54 offline/component tests passed (2 opt-in skips) and 21 browser tests passed. An isolated live scheduler test prepared two answers, left staff approvals at zero, and processed nothing on a second tick. The persistent worker was not installed by this merge. See the root README for optional setup.

## Submission

Event form: https://deepstation.ai/hackathons/vtl7ctbeihnikitvjwl3941h?tab=submission

Publishing this package to GitHub does not submit it to the hackathon. Confirm the form's accepted video format and upload/link requirements. No public hosted app is provided; localhost is not a judging URL. CSV import is supported, not direct QuickBooks sync.
