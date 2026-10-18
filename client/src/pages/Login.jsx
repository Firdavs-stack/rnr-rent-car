import {internalPath} from '../../../shared/navigation';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location=useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(internalPath(location.state?.from,['ADMIN','MANAGER','FLEET_MANAGER','CONTENT_MANAGER'].includes(data.user.role)?'/admin':'/'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, marginBottom: 8 }}>Вход</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Войдите в аккаунт RNR Rent Car</p>

        {location.state?.message&&<p className="success-message" role="status">{location.state.message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group"><label htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="input-group"><label htmlFor="password">Пароль</label><input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          {error && <p className="error-message" style={{ marginBottom: 16 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Нет аккаунта? <Link to="/register" state={location.state} style={{ color: 'var(--color-accent)' }}>Зарегистрироваться</Link>
        </p>

      </div>
    </div>
  );
}