# Obsidian LiveSync Setup

Self-hosted sync for Obsidian vault using CouchDB.

## Server Setup

1. Set CouchDB password in environment:
   ```bash
   export COUCHDB_PASSWORD="your-secure-password"
   ```

2. Start CouchDB:
   ```bash
   make livesync-start
   ```

3. Initialize the database (first time only):
   ```bash
   make livesync-init
   ```

4. Set up reverse proxy (nginx) for HTTPS access - see below.

## Nginx Configuration

Add to your nginx config:
```nginx
location /couchdb/ {
    proxy_pass http://127.0.0.1:5984/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Device Setup (Obsidian)

1. Install "Self-hosted LiveSync" plugin from Community Plugins
2. Open plugin settings
3. Configure remote database:
   - URI: `https://your-server.com/couchdb`
   - Username: `admin`
   - Password: your COUCHDB_PASSWORD
   - Database name: `obsidian-livesync`
4. Click "Test" to verify connection
5. Enable "Live Sync" or choose periodic sync

## Makefile Commands

- `make livesync-start` - Start CouchDB container
- `make livesync-stop` - Stop CouchDB container
- `make livesync-logs` - View CouchDB logs
- `make livesync-init` - Initialize database (first time)
