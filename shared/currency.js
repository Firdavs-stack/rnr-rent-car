export const USD_TO_UZS = 11900;
export const toUZS = (usd) => Math.round(Number(usd) * USD_TO_UZS);
export const formatUSD = (value) => '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value));
export const formatUZS = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value)).replace(/\u00a0/g, ' ') + ' сум';
export const formatDual = (usd) => `${formatUSD(usd)} · ${formatUZS(toUZS(usd))}`;
