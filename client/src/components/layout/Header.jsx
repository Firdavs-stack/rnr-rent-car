import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: 'var(--header-height)', background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: 2, color: 'var(--color-accent)' }}>RNR</span>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Rent Car</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }} className="desktop-nav">
          <Link to="/cars" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}>Автомобили</Link>
          <Link to="/services" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Услуги</Link>
          <Link to="/about" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, color: 'var(--color-text-secondary)' }}>О нас</Link>
          <Link to="/reviews" style={{fontSize:13,color:'var(--color-text-secondary)'}}>Отзывы</Link><Link to="/faq" style={{fontSize:13,color:'var(--color-text-secondary)'}}>FAQ</Link>
          <Link to="/contacts" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Контакты</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              {isAdmin && <Link to="/admin" className="btn btn-sm btn-secondary">Админ</Link>}
              <Link to="/notifications" className="desktop-nav" aria-label="Уведомления">◉</Link><Link to="/favorites" className="desktop-nav" aria-label="Избранное" style={{fontSize:20}}>♡</Link><Link to="/profile" className="desktop-nav" style={{fontSize:13}}>Профиль</Link>
              <Link to="/my-bookings" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }} className="desktop-nav">Мои брони</Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 13 }} className="desktop-nav">Выйти</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary desktop-nav">Войти</Link>
          )}
          
          {/* Burger Menu Button - УЛУЧШЕННЫЙ */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={{ 
              display: 'none', 
              background: 'var(--color-accent)', 
              border: 'none', 
              color: '#000',
              fontSize: 20, 
              width: 44,
              height: 44,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }} 
            className="mobile-menu-btn"
            aria-label="Меню" aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - УЛУЧШЕННЫЙ */}
      {menuOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 'var(--header-height)', 
          left: 0, 
          right: 0, 
          bottom: 'auto',
          height: 'calc(100dvh - var(--header-height))', 
          background: 'var(--color-bg)',
          padding: 32, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 24, 
          zIndex: 999,
          borderTop: '2px solid var(--color-accent)',
          overflowY: 'auto'
        }}>
          <Link to="/cars" onClick={() => setMenuOpen(false)} style={{ fontSize: 20, fontWeight: 600, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>Автомобили</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)} style={{ fontSize: 20, fontWeight: 600, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>Услуги</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} style={{ fontSize: 20, fontWeight: 600, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>О нас</Link>
          <Link to="/reviews" onClick={()=>setMenuOpen(false)}>Отзывы</Link><Link to="/faq" onClick={()=>setMenuOpen(false)}>FAQ</Link>
          <Link to="/contacts" onClick={() => setMenuOpen(false)} style={{ fontSize: 20, fontWeight: 600, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>Контакты</Link>
          
          {user ? (
            <>
              <Link to="/notifications" onClick={()=>setMenuOpen(false)}>Уведомления</Link><Link to="/profile" onClick={()=>setMenuOpen(false)}>Профиль</Link><Link to="/favorites" onClick={()=>setMenuOpen(false)}>Избранное</Link>
              <Link to="/my-bookings" onClick={() => setMenuOpen(false)} style={{ fontSize: 18, color: 'var(--color-text-secondary)', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>Мои бронирования</Link>
              {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ fontSize: 18, color: 'var(--color-accent)', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>Админ-панель</Link>}
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 16, padding: '12px 0', textAlign: 'left' }}>Выйти</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-primary" style={{ marginTop: 16 }}>Войти</Link>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}