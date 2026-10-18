import {Link} from 'react-router-dom';
import {formatDual} from '../utils/currency';
import { useState, useEffect } from 'react';
import { api } from '../api';

const serviceIcons = {
  'Подача в аэропорт': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  ),
  'Дополнительный водитель': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'Детское кресло': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  'Расширенная страховка': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'Доставка автомобиля': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  'Возврат в другом месте': (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api.services.list()
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false)); 
  }, []);

  if (loading) {
    return (
      <div className="page-header">
        <div className="container">
          <h1>Услуги</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 32 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 8 }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-header">
      <div className="container">
        <h1>Дополнительные услуги</h1><p className="demo-note">Учебные цены и условия. Услуги выбираются при бронировании.</p>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 12, marginBottom: 32 }}>
          Расширьте возможности вашей аренды с нашими дополнительными сервисами
        </p>

        {services.length === 0 ? (
          <div className="empty-state">
            <h3>Услуги скоро появятся</h3>
            <p>Следите за обновлениями</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, marginTop: 32 }}>
            {services.map((s) => (
              <div key={s.id} style={{ 
                padding: 32, 
                background: 'var(--color-bg-card)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 8,
                transition: 'all 0.3s',
                cursor: 'default'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 12, 
                  background: 'rgba(200,164,94,0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                  marginBottom: 20
                }}>
                  {serviceIcons[s.name] || (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                  )}
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600 }}>{s.name}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20, minHeight: 42 }}>
                  {s.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Стоимость</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>{formatDual(s.price)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>за день аренды</div>
                </div>
                <Link to="/cars" className="btn btn-secondary btn-sm" style={{marginTop:20}}>Выбрать автомобиль</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}