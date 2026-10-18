import {labelStatus} from '../../utils/statuses';
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState([]);
  const [error,setError]=useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.reviews.adminList().then(setReviews).catch(e=>setError(e.message)).finally(() => setLoading(false)); }, []);

  const moderate = async (id, status) => {
    try{await api.reviews.moderate(id, { status });
    setReviews(await api.reviews.adminList());}catch(e){setError(e.message);}
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Отзывы</h1>
      {error&&<p role="alert">{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: 16, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>{r.user?.firstName} {r.user?.lastName}</strong>
              <span className={`badge badge-${r.status.toLowerCase()}`}>{labelStatus(r.status)}</span>
            </div>
            <div style={{ color: 'var(--color-accent)', marginBottom: 8 }}>{'★'.repeat(r.rating)}</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{r.text}</p>
            {r.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => moderate(r.id, 'APPROVED')} className="btn btn-sm btn-primary">Одобрить</button>
                <button onClick={() => moderate(r.id, 'REJECTED')} className="btn btn-sm btn-danger">Отклонить</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}