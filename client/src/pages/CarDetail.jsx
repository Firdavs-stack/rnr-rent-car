import CarCard from '../components/car/CarCard';
import {labelStatus} from '../utils/statuses';
import AvailabilityCalendar from '../components/car/AvailabilityCalendar';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CarGallery from '../components/car/CarGallery';
import { formatUZS, toUZS } from '../utils/currency';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Viewer360 from '../components/car/Viewer360';
import { api } from '../api';

export default function CarDetail() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [saved,setSaved] = useState(false);
  const [favoriteError,setFavoriteError] = useState('');
  const navigate = useNavigate();
  const [related,setRelated]=useState([]);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImage, setActiveImage] = useState(0);
  const [mediaMode, setMediaMode] = useState('gallery');

  useEffect(() => {
    setLoading(true);
    let active=true;
    api.cars.getBySlug(slug).then(data=>{if(active){setCar(data);api.cars.list({category:data.category,limit:4}).then(r=>{if(active)setRelated(r.cars.filter(c=>c.id!==data.id).slice(0,3));}).catch(()=>{});}}).catch(()=>{if(active)setCar(null);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  }, [slug]);

  useEffect(()=>{setSaved(false);if(user&&car)api.favorites.list().then(items=>setSaved(items.some(c=>c.id===car.id))).catch(()=>{});},[user,car?.id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!car) return <div className="empty-state"><h3>Автомобиль не найден</h3></div>;

  const specifications={...(car.specs||{}),'Кузов':car.bodyType||'Уточняется','Класс':car.category||'Уточняется','Двигатель':car.engineType||'Уточняется','Коробка передач':car.transmission||'Уточняется','Привод':car.drive||'Уточняется','Количество мест':car.seats||'Уточняется'};
  const tabs = [
    { key: 'overview', label: 'Обзор' },
    { key: 'specs', label: 'Характеристики' },
    { key: 'equipment', label: 'Комплектация' },
    { key: 'terms', label: 'Условия аренды' },
  ];

  return (
    <div style={{ paddingTop: 'var(--header-height)' }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>
          {/* Left: Media */}
          <div>
            {/* Media Mode Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setMediaMode('gallery')} className={`btn btn-sm ${mediaMode === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}>Галерея</button>
              <button onClick={() => setMediaMode('360')} className={`btn btn-sm ${mediaMode === '360' ? 'btn-primary' : 'btn-secondary'}`}>360°</button>
              {car.videos?.length > 0 && <button onClick={() => setMediaMode('video')} className={`btn btn-sm ${mediaMode === 'video' ? 'btn-primary' : 'btn-secondary'}`}>Видео</button>}
            </div>

            {mediaMode === 'gallery' && <CarGallery key={slug} images={car.images} name={`${car.brand} ${car.model}`}/>}

            {mediaMode === '360' && <Viewer360 frames={car.frames360} carName={`${car.brand} ${car.model}`} />}

            {mediaMode === 'video' && car.videos?.[0] && (
              <video controls style={{ width: '100%', borderRadius: 8 }}>
                <source src={car.videos[0].url} />
              </video>
            )}

            <AvailabilityCalendar key={slug} car={car} query={params.toString()}/>
            {/* Tabs Content */}
            <div style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 24 }}>
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent', color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-muted)', fontSize: 14, fontWeight: 500 }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>{car.description}</p>}
              {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(specifications).map(([k, v]) => (
                    <div key={k} style={{ padding: 12, background: 'var(--color-bg-card)', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'equipment' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(car.features?.length?car.features:['Комплектация уточняется']).map((f, i) => <span key={i} style={{ padding: '8px 16px', background: 'var(--color-bg-card)', borderRadius: 4, fontSize: 14 }}>{f}</span>)}
                </div>
              )}
              {activeTab === 'terms' && (
                <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <p className="demo-note">Демонстрационные условия проекта</p><p>• Минимальный возраст водителя: 21 год</p>
                  <p>• Стаж вождения: от 2 лет</p>
                  <p>• Необходимые документы: паспорт, водительское удостоверение</p>
                  <p>• Залог: от $200 (зависит от класса автомобиля)</p>
                  <p>• Суточный лимит пробега: 300 км</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Panel */}
          <div style={{ position: 'sticky', top: 96, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 28 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 4 }}>{car.brand}</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{car.model}</h1>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>{car.year || 'Год уточняется'} {car.color ? `• ${car.color}` : ''}</div>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-accent)' }}>${car.pricePerDay}</span>
              <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>/ сутки</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Двигатель', value: car.engineType },
                { label: 'Топливо', value: car.fuelType },
                { label: 'КПП', value: car.transmission },
                { label: 'Привод', value: car.drive },
                { label: 'Мест', value: car.seats },
                { label: 'Пробег', value: `${car.mileage?.toLocaleString()} км` },
              ].map((s) => (
                <div key={s.label} style={{ padding: 10, background: 'var(--color-bg-input)', borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{s.value || '—'}</div>
                </div>
              ))}
            </div>

            <p className="demo-note">{formatUZS(toUZS(car.pricePerDay))} / сутки · учебная цена</p>
            <span className={`badge badge-${car.status.toLowerCase()}`} style={{ marginBottom: 20, display: 'inline-block' }}>
              {car.status === 'AVAILABLE' ? 'Доступен для аренды' : labelStatus(car.status)}
            </span>

            <button onClick={() => navigate(`/booking/${car.slug}?${params}`)} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 12 }} disabled={['MAINTENANCE','DAMAGED','UNAVAILABLE','WASHING'].includes(car.status)}>
              Забронировать
            </button>
            <button className="btn btn-secondary" style={{width:'100%',marginTop:12}} onClick={async()=>{if(!user){navigate('/login');return;}try{if(saved)await api.favorites.remove(car.id);else await api.favorites.add(car.id);setSaved(!saved);}catch(e){setFavoriteError(e.message);}}}>{saved?'Убрать из избранного':'В избранное'}</button>
            {favoriteError&&<p role="alert">{favoriteError}</p>}
          </div>
        </div>
      </div>

      {related.length>0&&<section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">Продолжить выбор</div><h2>Похожие автомобили</h2></div></div><div className="car-grid">{related.map(c=><CarCard key={c.id} car={c}/>)}</div></div></section>}
      <style>{`@media (max-width: 900px) { .container > div { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}