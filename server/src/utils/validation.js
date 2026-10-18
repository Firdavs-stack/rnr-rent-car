export function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
export function text(value, label, { required = false, max = 200, nullable = false } = {}) {
  if (value === undefined) { if (required) throw httpError(400, `Укажите ${label}`); return undefined; }
  if (value === null && nullable) return null;
  if (typeof value !== 'string') throw httpError(400, `Некорректное поле: ${label}`);
  const result = value.trim();
  if ((required && !result) || result.length > max) throw httpError(400, `Проверьте ${label} (до ${max} символов)`);
  return result;
}
export function emailAddress(value) {
  const email = text(value, 'email', { required: true, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'Укажите корректный email');
  return email;
}
export function passwordValue(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) throw httpError(400, 'Пароль: минимум 8 символов и максимум 72 байта');
  return value;
}
export function numberValue(value, label, { min = 0, max = 100000000, integer = false, nullable = false } = {}) {
  if (value === null && nullable) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw httpError(400, `Проверьте ${label}`);
  return value;
}
export function enumValue(value, values, label) { if (!values.includes(value)) throw httpError(400, `Некорректное поле: ${label}`); return value; }
export function moneyValue(value, label = 'сумму', { allowZero = true } = {}) {
  numberValue(value, label, { min: allowZero ? 0 : 0.01 });
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) throw httpError(400, 'Денежные суммы должны содержать не больше двух знаков после запятой');
  return Math.round(value * 100) / 100;
}
