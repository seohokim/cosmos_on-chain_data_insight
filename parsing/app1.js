const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// JSON 데이터를 읽어옴
const rawData = fs.readFileSync('./module-balance.juno.json');
const data = JSON.parse(rawData);

const initialTimestamp = moment.tz("2023-05-08 02:00", "UTC");
const cutOffTimestamp = moment.tz("2023-01-21 19:00", "UTC");

const timestampCount = initialTimestamp.diff(cutOffTimestamp, 'hours') + 1;
const totalBalances = new Array(timestampCount).fill(0);

data.modules
  .filter((module) => module.type === 'EXCHANGE')
  .forEach((module) => {
    const { name, balances } = module;

    const uatomBalances = balances.filter((balance) => balance.denom === 'uatom');

    uatomBalances.forEach((balance) => {
      const nullCount = balance.amounts.slice(0, timestampCount).filter((amount) => amount === -1).length;

      if (nullCount < 1000) {
        for (let i = 0; i < timestampCount; i++) {
          const amount = balance.amounts[i];
          if (amount === -1) {
            totalBalances[i] = null;
          } else if (totalBalances[i] !== null) {
            totalBalances[i] += amount;
          }
        }
      }
    });
  });

  function calculateChangeRate(current, previous) {
    if (current === null || previous === null) return null;
    return ((current - previous) / previous) * 100;
  }
  
  function calculateChange(current, previous) {
    if (current === null || previous === null) return null;
    return current - previous;
  }
  
  let csvContent = 'timestamp,balance(ATOM),change_rate,change_amount\n';
  
  totalBalances.forEach((balance, index) => {
    const timestamp = initialTimestamp.clone().subtract(index, 'hours').utc().format();
  
    let previousIndex = index + 1;
    while (previousIndex < totalBalances.length && totalBalances[previousIndex] === null) {
      previousIndex++;
    }
  
    const changeRate = calculateChangeRate(balance, totalBalances[previousIndex]);
    const changeRateFormatted = changeRate === null ? 'null' : changeRate.toFixed(2);
  
    const changeAmount = calculateChange(balance, totalBalances[previousIndex]);
    const changeAmountFormatted = changeAmount === null ? 'null' : changeAmount/1000000;
  
    csvContent += `${timestamp},${balance === null ? 'null' : balance/1000000},${changeRateFormatted},${changeAmountFormatted}\n`;
  });
  
  fs.writeFileSync('juno_uatom_exchange_balances.csv', csvContent);
  
