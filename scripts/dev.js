// Ishlab chiqish rejimi: API server (avtomatik qayta yuklanadi) + Vite (5173).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = path.join(root, "node_modules", "vite", "bin", "vite.js");

const children = [
  spawn(process.execPath, ["--watch", "server/index.js"], { cwd: root, stdio: "inherit" }),
  spawn(process.execPath, [vite], { cwd: root, stdio: "inherit" }),
];

const stop = () => {
  for (const child of children) child.kill();
  process.exit();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", stop);
