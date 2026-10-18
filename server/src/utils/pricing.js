export function calculatePricing(pricePerDay, pickupDate, returnDate, services = [], deliveryFee = 0, insuranceFee = 0) {
  const duration = new Date(returnDate) - new Date(pickupDate);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(pricePerDay) || pricePerDay < 0) throw new Error('Некорректные даты или цена');
  const daysCount = Math.ceil(duration / 86400000);
  const round = n => Math.round(n * 100) / 100;
  const basePrice = round(pricePerDay * daysCount);
  const servicesTotal = round(services.reduce((sum, s) => sum + s.price * daysCount, 0));
  return { basePrice, daysCount, servicesTotal, deliveryFee, insuranceFee, totalPrice: round(basePrice + servicesTotal + deliveryFee + insuranceFee) };
}
