const { spawn } = require("child_process");

const xrayCommand = spawn("docker", ["exec", "-i", "xray", "xray", "api", "--stats"]);

xrayCommand.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

xrayCommand.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

xrayCommand.on("close", (code) => {
  console.log(`Процесс завершён с кодом ${code}`);
});
