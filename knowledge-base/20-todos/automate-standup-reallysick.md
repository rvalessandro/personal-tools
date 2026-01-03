---
created: 2026-01-02
owner: me
delegated_to:
delegated_what:
delegated_when:
priority: done
category: 2
estimate: 4h
due: 2026-01-03
status: done
tags: [automation, reallysick, standup]
---

# Automate Daily Standup for ReallySick Team

## Description

Build automated daily standup reports using git commits (via git-standup) and Linear activity, so the team stops manually filling in Discord standups and shifts conversation to Linear/GitHub.

**Goal:** Team doesn't need to do anything - system reads their git commits and Linear activity from previous day and generates standup report automatically.

## Tasks

- [x] Set up git commit fetching for reallysick-monorepo
  - Used GitHub API via `gh` CLI instead of git-standup
  - Fetches commits for 6 team members: Alvin, Aufa, Jennifer, Hazel, Kevin, Vincent
  - Uses Jakarta timezone for date boundaries

- [ ] Pull Linear activity per team member (deferred)
  - Can add later if needed
  - Current implementation focuses on git commits

- [x] Generate standup report format
  - Format shows commits per team member
  - Lists inactive members at bottom
  - Markdown formatting for Telegram

- [x] Add Telegram bot commands
  - `/standup` - Generate daily standup report
  - `/team` - Show tracked team members

- [ ] Automate daily run (optional)
  - Can set up cron job later if needed
  - Currently manual via `/standup` command

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
