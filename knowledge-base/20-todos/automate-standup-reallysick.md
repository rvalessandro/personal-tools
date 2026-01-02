---
created: 2026-01-02
owner: me
delegated_to:
delegated_what:
delegated_when:
priority: today
category: 2
estimate: 4h
due: 2026-01-03
status: pending
tags: [automation, reallysick, standup]
---

# Automate Daily Standup for ReallySick Team

## Description

Build automated daily standup reports using git commits (via git-standup) and Linear activity, so the team stops manually filling in Discord standups and shifts conversation to Linear/GitHub.

**Goal:** Team doesn't need to do anything - system reads their git commits and Linear activity from previous day and generates standup report automatically.

## Tasks

- [ ] Set up git-standup for reallysick-monorepo (1h)
  - Install/configure github.com/kamtanahmedse/git-standup
  - Test commit extraction for team members
  - Handle multiple repos (start with monorepo, expand later)

- [ ] Pull Linear activity per team member (1.5h)
  - Use existing Linear MCP integration
  - Track: issues created, updated, commented, status changes
  - Filter by team members (add list later)
  - Query for previous day's activity

- [ ] Generate standup report format (1h)
  - Format: "What shipped? What's next? What's stuck?"
  - Combine git commits + Linear activity
  - Output per team member
  - Daily summary format

- [ ] Automate daily run (30min)
  - Cron job to run daily (e.g., 9 AM before standup)
  - Option to post to Discord/Slack or just generate report
  - Consider Telegram notification with summary

- [ ] Document for team
  - Announce: stop Discord standup, use Linear/GitHub instead
  - All updates should be in Linear comments and git commits
  - System auto-generates daily reports

## Context & Resources

**Tools:**
- git-standup: https://github.com/kamtanahmedse/git-standup
- Linear MCP: Already integrated in telegram-bot (`mcp__seedr-linear__*` tools)
- Existing automation: `/today` command shows calendar + todos

**Team Members:**
- Will add list of ReallySick team members to track

**Related Files:**
- `/home/andro/personal-tools/telegram-bot/` - Existing automation infrastructure
- Linear workspace: See-Dr Pte Ltd (seedr-linear MCP)

**Output Location:**
- Could integrate into `/today` briefing
- Or separate `/standup` command
- Could post to Discord/Slack channel automatically

## Notes

Start with reallysick-monorepo first, then expand to other repos once working.

This shifts team culture from "fill in standup" to "work in Linear and commit to git" - context lives in tools, not Discord.
