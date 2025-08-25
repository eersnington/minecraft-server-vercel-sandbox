# Minecraft Server on Vercel Sandbox

Deploys a Minecraft server using Vercel's Sandbox SDK with ngrok tunnel.

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- Vercel account with API access
- Ngrok account with auth token

## Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/eersnington/minecraft-server-vercel-sandbox.git
cd minecraft-vercel-sandbox-sdk
bun install
```

### 2. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Vercel Team/Organization ID (found in your Vercel dashboard)
VERCEL_TEAM_ID="team_xxxxxxxxxx"

# Vercel Project ID (any project within your team/org)
VERCEL_PROJECT_ID="prj_xxxxxxxxxx"

# Vercel API Token with project access scope
VERCEL_TOKEN="your_vercel_token_here"

# ngrok Authentication Token
NGROK_TOKEN="your_ngrok_token_here"
```

### 3. Get Required Tokens

#### Vercel Credentials

1. **Team ID**: Go to your [Vercel dashboard](https://vercel.com/dashboard) → Settings → General
2. **Project ID**: Select any project → Settings → General → Project ID
3. **API Token**: Visit [Account Settings → Tokens](https://vercel.com/account/settings/tokens)
   - Create a new token with appropriate scopes
   - Ensure it has access to your team/organization

#### ngrok Token

1. Sign up at [ngrok.com](https://ngrok.com)
2. Go to [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your authentication token

## Usage

Start the Minecraft server:

```bash
bun start
```

Or run directly:

```bash
bun run index.ts
```

## What This Script Does

1. **Creates Vercel Sandbox**: Spins up a containerized environment with:
   - 2 vCPUs allocated
   - 45-minute maximum session time
   - Port 25565 exposed (Minecraft default)
   - Node.js 22 runtime

2. **Installs Dependencies**:
   - Java 21 (Amazon Corretto)
   - wget and tar utilities

3. **Downloads Minecraft Server**:
   - Fetches the latest Minecraft server JAR
   - Accepts the EULA automatically

4. **Starts Minecraft Server**:
   - Allocates 1GB RAM (adjustable)
   - Runs in background with logging

5. **Sets up ngrok Tunnel**:
   - Downloads and configures ngrok
   - Creates TCP tunnel on port 25565
   - Provides public server address

## Server Configuration

The Minecraft server runs with default settings:
- **RAM**: 1GB (modify `-Xmx1024M -Xms1024M` in [`index.ts`](index.ts:64))
- **Port**: 25565
- **Mode**: Survival (default)
- **Difficulty**: Normal (default)

## Connecting to Your Server

After successful startup, you'll see output like:
```
Minecraft server is up and ngrok tunnel is ready!
Connect using: tcp://0.tcp.ngrok.io:12345
Note: don't add tcp:// in the server ip
```

In Minecraft:
1. Go to Multiplayer → Add Server
2. Enter server address: `0.tcp.ngrok.io:12345` (without `tcp://`)
3. Connect and enjoy your server that runs on vercel's hardware :]

## Important Notes

- **Duration**: Sandboxes have a maximum runtime duration of 45 minutes, with a default of 5 minutes
- **Max Resources**: 8 vCPUs. You will get 2048 MB of memory per vCPU
- **Data**: Server data is not persistent between runs
- **Cost**: Uses Vercel Sandbox compute resources (check your plan and alloted usage + billing)
- **Bandwidth**: If you're on the free tier of Ngrok, you might get disconnect if you hit bandwidth limit

## Troubleshooting

### Server Not Starting
- Check that all environment variables are set correctly
- Verify your Vercel token has appropriate permissions
- Ensure your ngrok token is valid

### Connection Issues
- Wait for the full startup process to complete
- Check that the ngrok tunnel URL is displayed
- Verify port 25565 is accessible

### Performance Issues
- Adjust memory allocation in the Java command
- Consider reducing render distance in server.properties
- Limit the number of concurrent players

## Customization

### Server Properties
Add server configuration by modifying the startup script to create a `server.properties` file:

```typescript
await mcSandbox.runCommand({
    cmd: "sh",
    args: ["-c", 'echo "max-players=10\ndifficulty=easy" > server.properties'],
    stdout: process.stdout,
    stderr: process.stderr,
});
```

### Memory Allocation
Adjust the Java memory flags in [`index.ts`](index.ts:64):
```typescript
"java -Xmx2048M -Xms2048M -jar server.jar nogui > server.log 2>&1 &"
```
