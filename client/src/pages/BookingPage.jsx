import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { formatUZS, toUZS } from '../utils/currency';
import { api } from '../api';

export default function BookingPage() {
  const { carSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [car, setCar] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    pickupDate: searchParams.get('pickupDate') || '',
    pickupTime: searchParams.get('pickupTime') || '10:00',
    returnDate: searchParams.get('returnDate') || '',
    returnTime: searchParams.get('returnTime') || '10:00',
    pickupLocation: 'Офис RNR, Ташкент',
    returnLocation: 'Офис RNR, Ташкент',
  });

  useEffect(() => {
    Promise.all([api.cars.getBySlug(carSlug), api.services.list()])
      .then(([carData, servicesData]) => { setCar(carData); setServices(servicesData); })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [carSlug]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!car) return <div className="empty-state"><h3>Автомобиль не найден</h3></div>;

  const duration=new Date(`${form.returnDate}T${form.returnTime}:00+05:00`)-new Date(`${form.pickupDate}T${form.pickupTime}:00+05:00`);
  const days = Number.isFinite(duration)&&duration>0?Math.ceil(duration/86400000):0;
  const basePrice = car.pricePerDay * days;
  const servicesTotal = selectedServices.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price || 0), 0) * days;
  const totalPrice = basePrice + servicesTotal;

  const toggleService = (id) => {
    setSelectedServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.pickupDate || !form.returnDate) { setError('Укажите даты'); return; }
    if (!Number.isFinite(duration) || duration <= 0) { setError('Дата возврата должна быть позже даты получения'); return; }

    setSubmitting(true);
    try {
      const selected = selectedServices.map((id) => services.find((s) => s.id === id)).filter(Boolean);
      const booking = await api.bookings.create({
        carId: car.id,
        ...form,
        selectedServices: selected,
      });
      navigate(`/booking/success/${booking.id}`);
    } catch (err) {
      setError(err.message || 'Ошибка бронирования');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-text)', fontSize: 15 };

  return (
    <div style={{ paddingTop: 'var(--header-height)' }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <p className="demo-note">Учебное бронирование. Онлайн-оплата не подключена.</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, marginBottom: 32 }}>Бронирование</h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Даты и место</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group"><label htmlFor="pickupDate">Дата получения</label><input id="pickupDate" type="date" required min={new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent'}).format(new Date())} value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} style={inputStyle} /></div>
                <div className="input-group"><label>Время</label><input type="time" required value={form.pickupTime} onChange={(e) => setForm({ ...form, pickupTime: e.target.value })} style={inputStyle} /></div>
                <div className="input-group"><label htmlFor="returnDate">Дата возврата</label><input id="returnDate" type="date" required min={new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent'}).format(new Date())} value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} style={inputStyle} /></div>
                <div className="input-group"><label>Время</label><input type="time" required value={form.returnTime} onChange={(e) => setForm({ ...form, returnTime: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="input-group"><label htmlFor="pickupLocation">Место получения</label><input id="pickupLocation" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} style={inputStyle} /></div>
                <div className="input-group"><label htmlFor="returnLocation">Место возврата</label><input id="returnLocation" value={form.returnLocation} onChange={(e) => setForm({ ...form, returnLocation: e.target.value })} style={inputStyle} /></div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 28 }}>
              <h3 style={{ fontSize: 18, marginBottom: 20 }}>Дополнительные услуги</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {services.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: selectedServices.includes(s.id) ? 'rgba(200,164,94,0.1)' : 'var(--color-bg-input)', border: `1px solid ${selectedServices.includes(s.id) ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => toggleService(s.id)} style={{ accentColor: 'var(--color-accent)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.description}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>${s.price}/день</div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ position: 'sticky', top: 96, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <img src={car.images?.[0]?.url} alt="" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 4 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{car.brand} {car.model}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{car.year}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-secondary)' }}>Автомобиль × {days} дн.</span><span>${basePrice}</span></div>
              {servicesTotal > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-text-secondary)' }}>Услуги</span><span>${servicesTotal}</span></div>}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>Итого</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>${totalPrice}</span>
            </div>

            <p className="demo-note">{formatUZS(toUZS(totalPrice))} · курс 1 USD = 11 900 UZS</p>
            {error && <p className="error-message" style={{ marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting || days === 0}>
              {submitting ? 'Бронирование...' : 'Забронировать'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@media (max-width: 900px) { form { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}