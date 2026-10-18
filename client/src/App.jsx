import Notifications from './pages/Notifications';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CarDetail from './pages/CarDetail';
import BookingPage from './pages/BookingPage';
import BookingSuccess from './pages/BookingSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import Favorites from './pages/Favorites';
import About from './pages/About';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import FAQ from './pages/FAQ';
import Contacts from './pages/Contacts';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import CarsAdmin from './pages/admin/Cars';
import BookingsAdmin from './pages/admin/Bookings';
import CalendarAdmin from './pages/admin/Calendar';
import Handover from './pages/admin/Handover';
import Returns from './pages/admin/Returns';
import Customers from './pages/admin/Customers';
import Payments from './pages/admin/Payments';
import Damages from './pages/admin/Damages';
import Maintenance from './pages/admin/Maintenance';
import ReviewsAdmin from './pages/admin/ReviewsAdmin';
import Staff from './pages/admin/Staff';
import ContactsAdmin from './pages/admin/ContactsAdmin';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import Legal from './pages/Legal';
import Settings from './pages/admin/Settings';

function ProtectedRoute({ children, adminOnly, roles }) {
  const { user, loading, error, refreshUser } = useAuth();
  const location=useLocation();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if(error&&!user)return <div className="page-header"><div className="container"><h1>Не удалось загрузить аккаунт</h1><p role="alert">{error}</p><button className="btn btn-primary" onClick={refreshUser}>Повторить</button></div></div>;
  if (!user) return <Navigate to="/login" state={{from:location.pathname+location.search}} replace />;
  if (adminOnly && !['ADMIN', 'MANAGER', 'FLEET_MANAGER', 'CONTENT_MANAGER'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if(roles&&!roles.includes(user.role))return <Navigate to="/admin" replace/>;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cars" element={<Catalog />} />
        <Route path="cars/:slug" element={<CarDetail />} />
        <Route path="booking/:carSlug" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="booking/success/:id" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="terms" element={<Legal />} />
        <Route path="privacy" element={<Legal privacy />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="cars" element={<CarsAdmin />} />
        <Route path="bookings" element={<BookingsAdmin />} />
        <Route path="calendar" element={<CalendarAdmin />} />
        <Route path="handover" element={<Handover />} />
        <Route path="returns" element={<Returns />} />
        <Route path="customers" element={<Customers />} />
        <Route path="payments" element={<Payments />} />
        <Route path="damages" element={<Damages />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="staff" element={<Staff />} />
        <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><Staff allUsers /></ProtectedRoute>} />
        <Route path="settings" element={<Settings />} />
        <Route path="contacts" element={<ContactsAdmin />} />
        <Route path="services" element={<ServicesAdmin />} />
        <Route path="deposits" element={<Payments deposits />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}