import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Reviews() {
  const [error,setError]=useState('');
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api.reviews.list().then(setReviews).catch(e=>setError(e.message)); }, []);

  return (
    <div className="page-header"><div className="container">
      <h1>Отзывы</h1>{error&&<p role="alert">{error}</p>}<p className="demo-note">Учебные отзывы демонстрационных клиентов.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 32 }}>
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: 24, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>{r.user?.firstName} {r.user?.lastName}</strong>
              <span style={{ color: 'var(--color-accent)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>{r.booking?.car?.brand} {r.booking?.car?.model}</div>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{r.text}</p>
          </div>
        ))}
        {reviews.length === 0 && <div className="empty-state"><h3>Пока нет отзывов</h3></div>}
      </div>
    </div></div>
  );
}