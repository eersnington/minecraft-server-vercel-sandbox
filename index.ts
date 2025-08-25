import { Sandbox } from "@vercel/sandbox";
import ms from "ms";

const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const NGROK_TOKEN = process.env.NGROK_TOKEN;

async function main() {
	if (!VERCEL_TEAM_ID || !VERCEL_PROJECT_ID || !VERCEL_TOKEN) {
		console.error(
			"Please set VERCEL_TEAM_ID, VERCEL_PROJECT_ID, and VERCEL_TOKEN in your environment.",
		);
		process.exit(1);
	}

	const mcSandbox = await Sandbox.create({
		teamId: VERCEL_TEAM_ID,
		projectId: VERCEL_PROJECT_ID,
		token: VERCEL_TOKEN,
		resources: { vcpus: 2 },
		timeout: ms("45m"), // max session time
		ports: [25565],
		runtime: "node22",
	});

	await mcSandbox.runCommand({
		cmd: "sudo",
		args: [
			"dnf",
			"install",
			"-y",
			"java-21-amazon-corretto-devel",
			"wget",
			"tar",
		],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await mcSandbox.runCommand({
		cmd: "curl",
		args: [
			"-L",
			"-o",
			"server.jar",
			"https://piston-data.mojang.com/v1/objects/6bce4ef400e4efaa63a13d5e6f6b500be969ef81/server.jar",
		],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await mcSandbox.runCommand({
		cmd: "sh",
		args: ["-c", 'echo "eula=true" > eula.txt'],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await mcSandbox.runCommand({
		cmd: "sh",
		args: [
			"-c",
			"java -Xmx1024M -Xms1024M -jar server.jar nogui > server.log 2>&1 &",
		],
		stdout: process.stdout,
		stderr: process.stderr,
		detached: true,
	});

	await mcSandbox.runCommand({
		cmd: "curl",
		args: [
			"-L",
			"-o",
			"ngrok.tgz",
			"https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz",
		],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await mcSandbox.runCommand({
		cmd: "sudo",
		args: ["tar", "-xvzf", "ngrok.tgz", "-C", "/usr/local/bin"],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await mcSandbox.runCommand({
		cmd: "ngrok",
		args: ["authtoken", NGROK_TOKEN ?? ""],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	console.log("Starting ngrok TCP tunnel on port 25565...");

	await mcSandbox.runCommand({
		cmd: "sh",
		args: ["-c", "ngrok tcp 25565 --log=stdout > ngrok.log 2>&1 &"],
		stdout: process.stdout,
		stderr: process.stderr,
		detached: true,
	});

	console.log("Waiting for ngrok tunnel...");

	const urlResult = await mcSandbox.runCommand({
		cmd: "sh",
		args: [
			"-c",
			"timeout 15 sh -c 'until grep -o \"tcp://[0-9a-zA-Z.:]*\" ngrok.log | head -n 1; do sleep 1; done'",
		],
		stdout: process.stdout,
		stderr: process.stderr,
	});

	const cmd = await mcSandbox.getCommand(urlResult.cmdId);

	const done = await cmd.wait();
	const [stdout, stderr] = await Promise.all([done.stdout(), done.stderr()]);

	console.log("Minecraft server is up and ngrok tunnel is ready!");
	console.log("Connect using:", stdout);

	if (stderr) {
		console.log("Error:", stderr);
	}

	console.log("Note: you don't have to add tcp:// in the server ip");
}

main().catch(console.error);
