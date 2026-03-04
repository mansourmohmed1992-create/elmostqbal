const { spawn } = require('child_process');
const path = require('path');

// Resolve ts-node command for Windows (.cmd) or fallback to unix bin
const root = path.resolve(__dirname, '..');
const tsNodeCmd = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ts-node.cmd' : 'ts-node');
const serverFile = path.join(__dirname, 'index.ts');

console.log('Starting ts-node via:', tsNodeCmd, serverFile);

const child = spawn(tsNodeCmd, [serverFile], { stdio: 'inherit', cwd: root, shell: true });

child.on('exit', (code) => {
  console.log('ts-node exited with code', code);
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start ts-node child process:', err);
  process.exit(1);
});
