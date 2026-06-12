const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\athar\\.gemini\\antigravity-ide\\brain\\afe71061-a59e-4755-a6d8-f928446bede3\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.trim().split('\n');
  console.log("Last 5 log entries:");
  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    console.log(lines[i]);
  }
} catch (e) {
  console.error("Error reading log file:", e);
}
