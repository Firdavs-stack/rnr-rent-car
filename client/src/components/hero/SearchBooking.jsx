import {rentalPeriod,localDateString} from '../../../../shared/dates';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBooking() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ pickupDate: '', pickupTime: '10:00', returnDate: '', returnTime: '10:00', city: 'Ташкент', category:'' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.pickupDate || !form.returnDate) {
      setError('Укажите даты получения и возврата');
      return;
    }

    try{rentalPeriod(form,{future:true});}catch(error){setError(error.message);return;}

    const params = new URLSearchParams({ pickupDate: form.pickupDate, returnDate: form.returnDate, pickupTime: form.pickupTime, returnTime: form.returnTime, category: form.category, city:form.city });
    navigate(`/cars?${params}`);
  };

  const inputStyle = { padding: '14px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: '#fff', fontSize: 14, width: '100%' };
  const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', fontWeight: 600 };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 28, maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div>
          <label htmlFor="search-city" style={labelStyle}>Город</label>
          <select id="search-city" name="city" value={form.city} onChange={handleChange} style={inputStyle}>
            <option value="Ташкент">Ташкент</option>
          </select>
        </div>
        <div>
          <label htmlFor="search-pickupDate" style={labelStyle}>Дата получения</label>
          <input type="date" id="search-pickupDate" name="pickupDate" value={form.pickupDate} onChange={handleChange} style={inputStyle} min={localDateString()} />
        </div>
        <div>
          <label htmlFor="search-pickupTime" style={labelStyle}>Время получения</label>
          <input type="time" id="search-pickupTime" name="pickupTime" value={form.pickupTime} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="search-returnDate" style={labelStyle}>Дата возврата</label>
          <input type="date" id="search-returnDate" name="returnDate" value={form.returnDate} onChange={handleChange} style={inputStyle} min={form.pickupDate || localDateString()} />
        </div>
        <div>
          <label htmlFor="search-returnTime" style={labelStyle}>Время возврата</label>
          <input type="time" id="search-returnTime" name="returnTime" value={form.returnTime} onChange={handleChange} style={inputStyle} />
        </div>
        <div><label style={labelStyle}>Класс автомобиля</label><select aria-label="Класс автомобиля" value={form.category} name="category" onChange={handleChange} style={inputStyle}><option value="">Все классы</option>{['Эконом','Комфорт','Бизнес','Премиум'].map(c=><option key={c}>{c}</option>)}</select></div>
      </div>
      {error && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Найти автомобиль</button>
    </form>
  );
}