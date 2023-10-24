const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// JSON 데이터를 읽어옴
const rawData = fs.readFileSync('./module-balance.juno.json');
const data = JSON.parse(rawData);

const initialTimestamp = moment.tz("2023-05-08 02:00", "UTC");
const cutOffTimestamp = moment.tz("2023-01-21 19:00", "UTC");

data.modules.forEach((module) => {
  const { name, type, balances } = module;

  // 디렉토리 생성
  const dirPath = path.join('juno_balance_data', type, name);
  fs.mkdirSync(dirPath, { recursive: true });
  
  const numTimestamps = balances[0]?.amounts?.length || 0;
  if (numTimestamps === 0) return;

  const existingTruncatedDenoms = {};

  balances.forEach((balance) => {
    const { denom, amounts } = balance;

    let truncatedDenom;
    if (denom.includes('/')) {
      truncatedDenom = denom.split('/')[0];
    } else if (denom.length >= 12) {
      truncatedDenom = denom.slice(0, 5);
    } else {
      truncatedDenom = denom;
    }

    if (existingTruncatedDenoms[truncatedDenom]) {
      existingTruncatedDenoms[truncatedDenom]++;
    } else {
      existingTruncatedDenoms[truncatedDenom] = 1;
    }

    const fileName = `${name}_${truncatedDenom}${existingTruncatedDenoms[truncatedDenom] > 1 ? existingTruncatedDenoms[truncatedDenom] : ''}.csv`;
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(filePath)) {
      const header = `timestamp,amounts,${denom}\n`;
      fs.writeFileSync(filePath, header);
    }

    for (let i = 0; i < numTimestamps; i++) {
      const timestamp = initialTimestamp.clone().subtract(i, 'hours');

      if (timestamp.isBefore(cutOffTimestamp)) {
        break;
      }

      const formattedTimestamp = timestamp.utc().format();

      if (amounts && Array.isArray(amounts)) {
        const amount = amounts[i];
        const balanceValue = amount !== -1 ? amount : "null";

        const csvContent = `${formattedTimestamp},${balanceValue}\n`;
        fs.appendFileSync(filePath, csvContent);
      }
    }
  });
});
