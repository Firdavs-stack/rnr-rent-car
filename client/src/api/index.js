const API_BASE = '/api';

async function request(path, options = {}) {
  const config={...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}};
  if(config.body&&typeof config.body==='object')config.body=JSON.stringify(config.body);
  let res;
  try{res=await fetch(`${API_BASE}${path}`,config);}catch(error){if(error.name==='AbortError')throw error;throw new Error('Не удалось соединиться с сервером. Проверьте подключение.');}
  const data=await res.json().catch(()=>null);
  if(!res.ok){
    if(res.status===401&&!['/auth/login','/auth/register'].includes(path))window.dispatchEvent(new Event('rnr-session-ended'));
    const error=new Error(data?.error||'Ошибка запроса');error.status=res.status;error.data=data;throw error;
  }
  if(data===null)throw new Error('Сервер вернул некорректный ответ');
  return data;
}

export const api = {
  contacts: { create: data => request('/contacts', { method: 'POST', body: data }), list: () => request('/contacts'), update: (id,status) => request(`/contacts/${id}`, { method: 'PUT', body: {status} }) },
  settings: { get: () => request('/settings'), save: data => request('/settings', {method:'PUT',body:data}) },
  favorites: { list: () => request('/favorites'), add: id => request(`/favorites/${id}`, {method:'PUT'}), remove: id => request(`/favorites/${id}`, {method:'DELETE'}) },
  audit: id => request(`/audit/${id}`),
  staffCreate: data=>request('/staff',{method:'POST',body:data}),
  allUsers: ()=>request('/staff/users'),
  staffUpdate: (id,data) => request(`/staff/${id}`, {method:'PUT',body:data}),
  upload: async file => {const form = new FormData();form.append('file',file);const res = await fetch('/api/uploads',{method:'POST',body:form,credentials:'include'});const data = await res.json();if(!res.ok) throw new Error(data.error);return data;},
  carImage: (id,data) => request(`/cars/${id}/images`,{method:'POST',body:data}),
  mainImage: (id,imageId)=>request(`/cars/${id}/images/${imageId}/main`,{method:'PUT'}),
  deleteFrame: (id,frameId)=>request(`/cars/${id}/frames/${frameId}`,{method:'DELETE'}),
  deleteImage: (id,imageId) => request(`/cars/${id}/images/${imageId}`,{method:'DELETE'}),
  auth: {
    changePassword: data=>request('/auth/password',{method:'POST',body:data}),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },
  cars: {
    calendar: slug=>request(`/cars/${slug}/calendar`),
    list: (params) => request(`/cars?${new URLSearchParams(params)}`),
    getBySlug: (slug) => request(`/cars/${slug}`),
    checkAvailability: (data) => request('/cars/availability', { method: 'POST', body: data }),
    adminList: (params={}) => request(`/cars/admin?${new URLSearchParams(params)}`),
    restore: id=>request(`/cars/${id}/restore`,{method:'PUT'}),
    stats: () => request('/cars/stats'),
    create: (data) => request('/cars', { method: 'POST', body: data }),
    update: (id, data) => request(`/cars/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/cars/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    edit: (id,data)=>request(`/bookings/${id}`,{method:'PUT',body:data}),
    create: (data) => request('/bookings', { method: 'POST', body: data }),
    cancel: id => request(`/bookings/${id}/cancel`, {method:'PUT'}),
    my: () => request('/bookings/my'),
    all: (params) => request(`/bookings/all?${new URLSearchParams(params)}`),
    getById: (id) => request(`/bookings/${id}`),
    updateStatus: (id, data) => request(`/bookings/${id}/status`, { method: 'PUT', body: data }),
    handover: (id, data) => request(`/bookings/${id}/handover`, { method: 'PUT', body: data }),
    return: (id, data) => request(`/bookings/${id}/return`, { method: 'PUT', body: data }),
    today: () => request('/bookings/today'),
    calendar: (params) => request(`/bookings/calendar?${new URLSearchParams(params)}`),
  },
  reviews: {
    list: () => request('/reviews'),
    adminList: () => request('/reviews/admin'),
    create: (data) => request('/reviews', { method: 'POST', body: data }),
    moderate: (id, data) => request(`/reviews/${id}/moderate`, { method: 'PUT', body: data }),
  },
  services: {
    list: () => request('/services'),
    all: () => request('/services/all'),
    update: (id,data) => request(`/services/${id}`,{method:'PUT',body:data}),
    create: (data) => request('/services', { method: 'POST', body: data }),
  },
  users: {
    customers: () => request('/users/customers'),
    customerDetail: (id) => request(`/users/customers/${id}`),
    staff: () => request('/users/staff'),
    updateProfile: (data) => request('/users/profile', { method: 'PUT', body: data }),
  },
  payments: {
    list: () => request('/payments'),
    status: (id,status)=>request(`/payments/${id}/status`,{method:'PUT',body:{status}}),
    create: (data) => request('/payments', { method: 'POST', body: data }),
  },
  damages: {
    list: () => request('/damages'),
    create: (data) => request('/damages', { method: 'POST', body: data }),
    update: (id, data) => request(`/damages/${id}`, { method: 'PUT', body: data }),
  },
  maintenance: {
    list: () => request('/maintenance'),
    create: (data) => request('/maintenance', { method: 'POST', body: data }),
    complete: (id) => request(`/maintenance/${id}/complete`, { method: 'PUT' }),
  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  },
};