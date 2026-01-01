# Syncthing Setup

Sync `knowledge-base/` folder between server and all devices.

## Architecture

```
Server (knowledge-base/) ←→ Syncthing ←→ Desktop (Obsidian)
                                    ←→ Mobile (Obsidian)
```

## Server Setup

```bash
# Install Syncthing
make syncthing-install

# Access Web UI (from server or via SSH tunnel)
# http://127.0.0.1:8384
```

To access Web UI remotely, create SSH tunnel:
```bash
ssh -L 8384:localhost:8384 systeric-staging
# Then open http://localhost:8384 in browser
```

### Configure Server
1. Open Web UI
2. Add folder: `knowledge-base/`
   - Folder path: `/home/andro/personal-tools/knowledge-base`
   - Folder ID: `knowledge-base`
3. Note the Device ID (needed for other devices)

## Desktop Setup

### macOS
```bash
brew install syncthing
brew services start syncthing
# Open http://127.0.0.1:8384
```

### Windows/Linux
Download from https://syncthing.net/downloads/

### Configure Desktop
1. Open Web UI (http://127.0.0.1:8384)
2. Add Remote Device → paste Server's Device ID
3. Accept folder share from server
4. Set local folder path (e.g., `~/Obsidian/knowledge-base`)
5. Open this folder as Obsidian vault

## Mobile Setup

### Android
1. Install "Syncthing" from Play Store
2. Add server as remote device
3. Accept folder share
4. Set folder path (e.g., `/storage/emulated/0/Obsidian/knowledge-base`)
5. Open folder in Obsidian mobile app

### iOS
1. Install "Möbius Sync" from App Store ($5)
2. Add server as remote device
3. Accept folder share
4. Open folder in Obsidian mobile app

## Pairing Devices

Each device has a unique Device ID. To pair:

1. On Device A: Copy Device ID from Actions → Show ID
2. On Device B: Add Remote Device → paste Device ID
3. Device A will show a notification to accept
4. Share folders between paired devices

## Troubleshooting

```bash
# Check status on server
make syncthing-status

# View logs
journalctl -u syncthing@andro -f

# Restart
sudo systemctl restart syncthing@andro
```
