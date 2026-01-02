---
created: 2026-01-02
owner: me
delegated_to:
delegated_what:
delegated_when:
priority: this-week
category: 3
estimate: 1h
due: 2026-01-13
status: pending
tags: [noon, onboarding, knowledge-transfer]
---

# Onboard Hazel to NoOn

## Description

Onboard [[40-contacts/hazel|Hazel]] to NoOn project to ensure continuity during travel (Jan 14-28). Need to transition him from SeeDr/reallysick work and get him up to speed on NoOn so he can make changes and release to staging independently.

**Goal**: Hazel should be unblocked and able to ship to staging before Jan 14.

## Tasks
- [ ] Verify Hazel's current commitments & grant access (~30m)
  - Check for any critical work in reallysick/seedr that would block transition
  - Ensure handoff plan for SeeDr work if needed
  - Add to GitHub org/repos (AidenSb/noon)
  - Grant staging deployment access
  - Add to relevant Discord/Slack channels
- [ ] Knowledge transfer session - technical (~30m)
  - Walk through NoOn codebase architecture
  - Explain deployment process to staging
  - Review common workflows and gotchas
  - Share documentation and runbooks
- [ ] Product flow walkthrough (delegated to [[40-contacts/aziel|Aziel]])
  - Aziel to walk Hazel through product flows and business context
- [ ] First PR review (async via PR review process)
  - Have Hazel make a small change
  - Review PR asynchronously
  - Hazel deploys to staging after approval
- [ ] Follow-up check - scheduled for Jan 4 (~15m)
  - Verify Hazel feels confident
  - Address any blockers
  - Ensure contact plan during travel

## Context & Resources

**Why this matters:**
- Traveling Jan 14 for 14 days (Jan 14-28)
- Don't want to be a blocker for NoOn during travel
- Hazel currently on SeeDr work, transitioning to provide NoOn coverage

**Contacts:**
- [[40-contacts/hazel|Hazel]] - primary: Discord

**Related repos:**
- NoOn: AidenSb/noon
- SeeDr: reallysick/seedr (current work)

**Onboarding best practices:**
- First Round Review: [How to Onboard New Engineers](https://review.firstround.com/the-best-way-to-onboard-new-engineers-identify-crucial-skills-and-bridge-the-gaps)
- Will Larson: Staff Engineer - Chapter on knowledge transfer
- Pair on first deployment to reduce anxiety

## Notes

- Timeline is tight (11 days until travel) but doable
- Focus on "just enough" knowledge transfer - goal is unblocking, not mastery
- Supervised first deployment builds confidence
- Leave clear escalation path (Discord) during travel in case of issues

