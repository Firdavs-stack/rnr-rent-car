import {labelStatus} from '../../utils/statuses';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/admin', label: 'Операции', icon: '', end: true },
  { to: '/admin/cars', label: 'Автомобили', icon: '' },
  { to: '/admin/bookings', label: 'Бронирования', icon: '' },
  { to: '/admin/calendar', label: 'Календарь', icon: '' },
  { to: '/admin/handover', label: 'Выдача', icon: '' },
  { to: '/admin/returns', label: 'Возврат', icon: '↩' },
  { to: '/admin/customers', label: 'Клиенты', icon: '' },
  { to: '/admin/payments', label: 'Платежи', icon: '' },
  { to: '/admin/deposits', label: 'Залоги', icon: '' },
  { to: '/admin/contacts', label: 'Обращения', icon: '' },
  { to: '/admin/services', label: 'Услуги', icon: '' },
  { to: '/admin/damages', label: 'Повреждения', icon: '' },
  { to: '/admin/maintenance', label: 'Обслуживание', icon: '' },
  { to: '/admin/reviews', label: 'Отзывы', icon: '' },
  { to: '/admin/staff', label: 'Сотрудники', icon: '' },
  { to: '/admin/users', adminOnly:true, label: 'Пользователи и роли', icon: '' },
  { to: '/admin/settings', label: 'Настройки', icon: '' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 'var(--admin-sidebar-width)', background: 'var(--color-bg-elevated)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--color-accent)' }}>RNR</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Операционная панель</div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navItems.filter(item=>!item.adminOnly||user?.role==='ADMIN').map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              background: isActive ? 'var(--color-surface)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
              transition: 'all 0.15s',
            })}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{user?.firstName}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>{labelStatus(user?.role)}</div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 12, padding: 0 }}>Выйти</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 'var(--admin-sidebar-width)', padding: 32, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}