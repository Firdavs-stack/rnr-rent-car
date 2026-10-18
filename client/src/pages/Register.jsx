import {internalPath} from '../../../shared/navigation';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location=useLocation();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate(internalPath(location.state?.from));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, marginBottom: 8 }}>Регистрация</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Создайте аккаунт RNR Rent Car</p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group"><label htmlFor="firstName">Имя</label><input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="input-group"><label htmlFor="lastName">Фамилия</label><input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <div className="input-group"><label htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="input-group"><label htmlFor="phone">Телефон</label><input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="input-group"><label htmlFor="password">Пароль</label><input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} maxLength={72} /></div>
          {error && <p className="error-message" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>{loading ? '...' : 'Создать аккаунт'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Уже есть аккаунт? <Link to="/login" state={location.state} style={{ color: 'var(--color-accent)' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}