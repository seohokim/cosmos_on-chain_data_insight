const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const dataPath = './data/EXCHANGE';

const startTime = moment.tz("2023-03-28 20:00", "UTC");
const endTime = moment.tz("2023-03-28 21:00", "UTC");

fs.readdirSync(dataPath).forEach((name) => {
  const modulePath = path.join(dataPath, name);

  // 디렉토리인 경우에만 검색
  if (fs.lstatSync(modulePath).isDirectory()) {
    fs.readdirSync(modulePath).forEach((fileName) => {
      if (fileName.includes('uatom.csv')) {
        const filePath = path.join(modulePath, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        let previousBalance = null;
        let changeRate = null;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const [timestampStr, balanceStr] = line.split(',');

          if (!timestampStr || !balanceStr) continue;

          const timestamp = moment(timestampStr);
          const balance = balanceStr === 'null' ? null : parseFloat(balanceStr);

          if (timestamp.isBetween(startTime, endTime, 'hours', '[]')) {
            if (previousBalance !== null && balance !== null) {
              changeRate = ((previousBalance - balance) / balance) * 100;
              changeVolume = (previousBalance - balance)/1000000;
            }
            previousBalance = balance;
          }
        }

        if (changeRate !== null) {
          console.log(`${name} 변화율 : ${changeRate.toFixed(2)}% 변화량 : ${changeVolume.toFixed(2)}`);
        }
      }
    });
  }
});
