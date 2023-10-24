const fs = require('fs');

function sortUnitsByTokensAndCommissions(a, b) {
  if (a.tokens === b.tokens) {
    return a.commissions - b.commissions;
  } else {
    return b.tokens - a.tokens;
  }
}

function convertToCSV(jsonData) {
  const timestamps = jsonData.timestamps;
  const bondedTokens = jsonData.bondedTokens;
  const units = jsonData.units;

  // Save bondedTokens to a separate CSV file
  let bondedTokensCSV = 'timestamp,tokens\n';
  for (let i = 0; i < timestamps.length; i++) {
    let timestamp = new Date(timestamps[i]).toISOString().slice(0, 19).replace('T', ' ');
    bondedTokensCSV += `${timestamp},${bondedTokens[i]}\n`;
  }
  fs.writeFileSync('bondedTokens.csv', bondedTokensCSV);

  // Create validatorData folder if it doesn't exist
  if (!fs.existsSync('validatorData')) {
    fs.mkdirSync('validatorData');
  }

  let rank176Units = [];

  // Collect units with rank 176 at rank[0]
  units.forEach((unit) => {
    if (unit.ranks[0] === 176) {
      rank176Units.push({ tokens: unit.tokens[0], commissions: unit.commissions[0], address: unit.address });
    }
  });

  // Sort the rank 176 units based on their tokens and commissions
  rank176Units.sort(sortUnitsByTokensAndCommissions);

  // Save each unit's data to a separate CSV file in the validatorData folder
  units.forEach((unit) => {
    const address = unit.address;
    const ranks = unit.ranks;
    const tokens = unit.tokens;
    const commissions = unit.commissions;

    let unitCSV = 'timestamp,ranks,tokens(ATOM),commissions(%)\n';
    for (let i = 0; i < timestamps.length; i++) {
      let timestamp = new Date(timestamps[i]).toISOString().slice(0, 19).replace('T', ' ');

      if (ranks[i] === 176) {
        const rank176UnitsAtTimestamp = units
          .filter((u) => u.ranks[i] === 176)
          .map((u) => ({ tokens: u.tokens[i], commissions: u.commissions[i], address: u.address }));

        rank176UnitsAtTimestamp.sort(sortUnitsByTokensAndCommissions);
        const newRank = 176 + rank176UnitsAtTimestamp.findIndex((u) => u.address === address);
        unitCSV += `${timestamp},${newRank},${tokens[i] / 1000000},${commissions[i] * 100}\n`;
      } else {
        unitCSV += `${timestamp},${ranks[i]},${tokens[i] / 1000000},${commissions[i] * 100}\n`;
      }
    }

    if (ranks[0] === 176) {
      const num = 176 + rank176Units.findIndex((u) => u.address === address);
      const fileName = `${num}_${address}.csv`;
      fs.writeFileSync(`validatorData/${fileName}`, unitCSV);
    } else {
      const fileName = `${ranks[0]}_${address}.csv`;
      fs.writeFileSync(`validatorData/${fileName}`, unitCSV);
    }
  });
}

// Read the JSON data from an input file named "validator-status.json"
fs.readFile('validator-status.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading validator-status.json:', err);
    return;
  }
  const jsonData = JSON.parse(data);
  convertToCSV(jsonData);
});

