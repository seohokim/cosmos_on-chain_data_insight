const fs = require('fs');
const csv = fs.readFileSync('bonded_tokens_pool_uosmo.csv', 'utf-8');

const lines = csv.split('\n');
const header = lines.shift();

let parsedData = lines.map(line => {
  const [timestamp, amounts] = line.split(',');
  return { timestamp, amounts: amounts === 'null' ? null : Number(amounts) };
});

for (let i = 0; i < parsedData.length - 1; i++) {
  if (parsedData[i].amounts === null) {
    let nextNonNullIndex = i + 1;
    while (parsedData[nextNonNullIndex] && parsedData[nextNonNullIndex].amounts === null) {
      nextNonNullIndex++;
    }

    if (nextNonNullIndex < parsedData.length && parsedData[i - 1]) {
      const prevAmount = parsedData[i - 1].amounts;
      const nextAmount = parsedData[nextNonNullIndex].amounts;
      const steps = nextNonNullIndex - i + 1;
      const increment = (nextAmount - prevAmount) / steps;

      for (let j = i; j < nextNonNullIndex; j++) {
        parsedData[j].amounts = prevAmount + increment * (j - i + 1);
      }
    }

    i = nextNonNullIndex - 1;
  }
}

let outputCsv = header + '\n';
parsedData.forEach(({ timestamp, amounts }) => {
  outputCsv += `${timestamp},${amounts === null ? 'null' : amounts.toFixed(0)}\n`;
});

fs.writeFileSync('bonded_osmo.csv', outputCsv);
