# Knowledge Base

Personal Obsidian vault for notes, todos, and habit tracking.

## Folder Structure

- `00-inbox/` - Quick captures and unprocessed notes
- `10-notes/` - Processed knowledge base entries
- `20-todos/` - Task management
- `30-habits/` - Habit tracking
- `40-contacts/` - Personal CRM
- `daily/` - Daily notes
- `templates/` - Note templates for Obsidian

## Sync Setup

Uses git for syncing between desktop and server (no Syncthing).

### Desktop (Obsidian)

Install the `obsidian-git` plugin:
1. Settings → Community plugins → Browse → "Obsidian Git"
2. Configure auto-commit interval (e.g., every 10 minutes)
3. Enable auto-pull on startup

### Server

```bash
# Clone the repo
git clone <repo-url> ~/andro-tools
cd ~/andro-tools/knowledge-base/scripts

# Run setup (installs systemd timer)
./setup-server.sh

# Check status
systemctl --user status kb-sync.timer
```

The timer runs every 5 minutes to commit and push any changes.

## Claude Code Integration

Since this vault is in the same repo, Claude Code has native access to all files.

**Slash commands:**
- `/todo` - Create a new todo
- `/today` - Morning briefing with habits, todos, and quick kills

## Writing Style Guide

When creating content for Andro (meeting notes, templates, docs):

**Conversational, not formal:**
- ❌ "Progress" → ✅ "What shipped this week?"
- ❌ "Blockers" → ✅ "What's stuck or needs help?"
- ❌ "Action Items" → ✅ "What needs doing"
- ❌ "Support Needed" → ✅ (merged into "What's stuck")

**Principles:**
- Use natural questions instead of business jargon
- Reduce mental overhead - make it obvious what to fill in
- Avoid duplication (don't ask for same info twice)
- Keep it casual and low-friction
- Short, direct sentences without fluff
- No unnecessary formality
