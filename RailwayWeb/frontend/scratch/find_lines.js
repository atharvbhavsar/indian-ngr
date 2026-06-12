const fs = require('fs');
const lines = fs.readFileSync('src/StationMasterModule.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('renderReports') || l.includes('renderPme') || l.includes('renderContent') || l.includes('case "pmePosition"') || l.includes('case "reports"')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
