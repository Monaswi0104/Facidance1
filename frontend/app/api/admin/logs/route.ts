import { NextRequest, NextResponse } from "next/server";
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const ALLOWED_SERVICES = [
  "facidance-admin",
  "facidance-auth",
  "facidance-face",
  "facidance-frontend",
  "facidance-student",
  "facidance-teacher",
  "facidance-tunnel", // Re-add tunnel for local pm2 support
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  
  let decoded: { role?: string } | null = null;
  try {
    decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }

  if (!decoded || !decoded.role || decoded.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") || "facidance-frontend";
  const type = searchParams.get("type") || "out"; 
  const linesCount = parseInt(searchParams.get("lines") || "200", 10);

  if (!ALLOWED_SERVICES.includes(service)) {
    return NextResponse.json({ detail: "Invalid service requested" }, { status: 400 });
  }

  const serviceSuffix = service.replace("facidance-", "");
  const containerName = `facidance-${serviceSuffix}-1`;

  try {
    // 1. Try fetching logs from Docker socket
    const logs = await fetchDockerLogs(containerName, linesCount, type);
    return NextResponse.json({ logs });
  } catch (err: any) {
    // 2. Fallback to PM2 logs if Docker socket is unavailable (e.g. local dev)
    if (err.code === "ENOENT" || err.message === "No docker socket") {
      try {
        const pm2Logs = await fetchPM2Logs(service, linesCount, type);
        return NextResponse.json({ logs: pm2Logs });
      } catch (pm2Err) {
        return NextResponse.json({ detail: "Failed to read both Docker and PM2 logs." }, { status: 500 });
      }
    }

    if (err.message && err.message.includes("No such container")) {
      return NextResponse.json({ logs: [`Container ${containerName} not found. Is it running?`] });
    }
    return NextResponse.json({ detail: "Failed to read logs." }, { status: 500 });
  }
}

/**
 * Fetches logs directly from the Docker Engine API via the Unix socket
 */
function fetchDockerLogs(containerName: string, tail: number, type: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("/var/run/docker.sock")) {
      return reject(new Error("No docker socket"));
    }

    const stdout = type === "out" ? "true" : "false";
    const stderr = type === "error" ? "true" : "false";

    const options = {
      socketPath: "/var/run/docker.sock",
      path: `/containers/${containerName}/logs?stdout=${stdout}&stderr=${stderr}&tail=${tail}`,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 404) return reject(new Error("No such container"));
      if (res.statusCode !== 200) return reject(new Error(`Docker API returned status ${res.statusCode}`));

      let rawData = Buffer.alloc(0);
      res.on("data", (chunk) => rawData = Buffer.concat([rawData, chunk]));

      res.on("end", () => {
        const lines: string[] = [];
        let offset = 0;

        while (offset < rawData.length) {
          if (offset + 8 > rawData.length) break;
          const streamType = rawData.readUInt8(offset);
          const payloadSize = rawData.readUInt32BE(offset + 4);
          offset += 8;
          if (offset + payloadSize > rawData.length) break;

          const payload = rawData.subarray(offset, offset + payloadSize).toString("utf8");
          const splitLines = payload.split(/\r?\n/);
          for (const line of splitLines) {
            if (line) lines.push(`[${streamType === 1 ? 'STDOUT' : 'STDERR'}] ${line}`);
          }
          offset += payloadSize;
        }
        resolve(lines.slice(-tail));
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Fallback: Reads logs from ~/.pm2/logs
 */
async function fetchPM2Logs(service: string, maxLines: number, type: string): Promise<string[]> {
  const pm2Dir = path.join(os.homedir(), ".pm2", "logs");
  const fileName = `${service}-${type}.log`;
  const filePath = path.join(pm2Dir, fileName);

  if (!fs.existsSync(filePath)) {
    return [`No PM2 logs found at ${filePath}`];
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) return [];

  if (stat.size < 1024 * 1024) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter(Boolean);
    return lines.slice(-maxLines);
  }

  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream });

    rl.on("line", (line) => {
      lines.push(line);
      if (lines.length > maxLines) lines.shift();
    });
    rl.on("close", () => resolve(lines));
    rl.on("error", reject);
  });
}
