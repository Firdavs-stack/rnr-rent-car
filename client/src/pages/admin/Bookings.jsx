import {formatRentalDate} from '../../../../shared/dates';
import BookingEditor from '../../components/admin/BookingEditor';
import { formatDual } from '../../utils/currency';
import { useState, useEffect } from 'react';
import { api } from '../../api';

const statusLabels = { NEW: 'Новая', CONFIRMED: 'Подтверждена', PREPARING: 'Подготовка', HANDED_OVER: 'Выдана', ACTIVE: 'Активна', RETURNING: 'Возврат', COMPLETED: 'Завершена', CANCELLED: 'Отменена' };

export default function BookingsAdmin() {
  const [editing,setEditing]=useState(false);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error,setError] = useState('');
  const [history,setHistory] = useState([]);
  const [search,setSearch] = useState('');
  const [statusFilter,setStatusFilter] = useState('');
  useEffect(()=>{if(selected)api.audit(selected.id).then(setHistory).catch(e=>setError(e.message));},[selected]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.bookings.all({}).then(setBookings).catch(e=>setError(e.message)).finally(() => setLoading(false)); }, []);

  const changeStatus = async (id, status) => {
    try { await api.bookings.updateStatus(id, { status });
    const updated = await api.bookings.all({});
    setBookings(updated);
    if (selected?.id === id) setSelected(updated.find((b) => b.id === id));
    } catch(e){setError(e.message);}
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="booking-admin-layout" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Бронирования</h1>
        {error&&<p role="alert" className="error-message">{error}</p>}
        <div className="actions"><input aria-label="Поиск бронирований" placeholder="Номер, клиент, автомобиль" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Статус бронирования" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Все статусы</option>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>№</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>Клиент</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>Авто</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>Даты</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>Статус</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {bookings.filter(b=>(!statusFilter||b.status===statusFilter)&&`${b.bookingNumber} ${b.user?.firstName} ${b.car?.brand} ${b.car?.model}`.toLowerCase().includes(search.toLowerCase())).map((b) => (
                <tr key={b.id} onClick={() => {setSelected(b);setEditing(false);}} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: selected?.id === b.id ? 'var(--color-surface)' : 'transparent' }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 12 }}>{b.bookingNumber}</td>
                  <td style={{ padding: '10px 8px' }}>{b.user?.firstName} {b.user?.lastName}</td>
                  <td style={{ padding: '10px 8px' }}>{b.car?.brand} {b.car?.model}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12 }}>{formatRentalDate(b.pickupDate)} — {formatRentalDate(b.returnDate)}</td>
                  <td style={{ padding: '10px 8px' }}><span className={`badge badge-${b.status.toLowerCase()}`}>{statusLabels[b.status]}</span></td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{formatDual(b.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24, position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>{selected.bookingNumber}</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Клиент:</span> {selected.user?.firstName} {selected.user?.lastName}</div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Телефон:</span> {selected.user?.phone}</div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Авто:</span> {selected.car?.brand} {selected.car?.model}</div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Период:</span> {formatRentalDate(selected.pickupDate)} — {formatRentalDate(selected.returnDate)}</div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Сумма:</span> <strong>{formatDual(selected.totalPrice)}</strong></div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selected.status === 'NEW' && <button onClick={() => changeStatus(selected.id, 'CONFIRMED')} className="btn btn-sm btn-primary">Подтвердить</button>}
            {selected.status === 'CONFIRMED' && <button onClick={() => changeStatus(selected.id, 'PREPARING')} className="btn btn-sm btn-secondary">Подготовка</button>}
            {['NEW','CONFIRMED','PREPARING'].includes(selected.status) && <button onClick={() => changeStatus(selected.id, 'CANCELLED')} className="btn btn-sm btn-danger">Отменить</button>}
          </div>
          {['NEW','CONFIRMED','PREPARING','ACTIVE','RETURNING'].includes(selected.status)&&<button className="btn btn-secondary btn-sm" style={{marginTop:16}} onClick={()=>setEditing(!editing)}>{['ACTIVE','RETURNING'].includes(selected.status)?'Продлить аренду':'Редактировать заявку'}</button>}
          {editing&&<BookingEditor key={selected.id} booking={selected} onClose={()=>setEditing(false)} onSaved={async()=>{const updated=await api.bookings.all();setBookings(updated);setSelected(updated.find(b=>b.id===selected.id));setEditing(false);}}/>}
          <h4 style={{marginTop:24}}>История изменений</h4>{history.map(h=><p key={h.id} className="demo-note">{new Date(h.createdAt).toLocaleString('ru-RU',{timeZone:'Asia/Tashkent'})} · {h.action} {h.details?.from&&`${h.details.from} → ${h.details.to}`}</p>)}
        </div>
      )}
    </div>
  );
}