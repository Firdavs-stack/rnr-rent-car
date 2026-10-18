import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 72, fontFamily: 'var(--font-serif)', color: 'var(--color-accent)' }}>404</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>Страница не найдена</p>
      <Link to="/" className="btn btn-primary">На главную</Link>
    </div>
  );
}