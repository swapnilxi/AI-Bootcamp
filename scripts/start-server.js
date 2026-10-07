const { spawn } = require("child_process");

const child = spawn("npx", ["next", "start", "-p", "3000"], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  console.log("Next.js exited with code:", code);
  process.exit(code || 0);
});

// Keep event loop active
setInterval(() => {}, 10000);
