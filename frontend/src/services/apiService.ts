import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  picture?: string;
}

export interface Palazzina {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  admin_id: number;
}

export interface Appartamento {
  id: number;
  palazzina_id: number;
  numero: string;
  piano?: string;
  proprietario_name: string;
  proprietario_email: string;
  proprietario_phone?: string;
  quota_millesimi: number;
}

export interface Spesa {
  id: number;
  palazzina_id: number;
  descrizione: string;
  importo: number;
  data_spesa: string;
  categoria?: string;
  note?: string;
  pagamenti?: Pagamento[];
}

export interface Pagamento {
  id: number;
  spesa_id: number;
  appartamento_id: number;
  importo: number;
  stato: 'pendente' | 'pagato';
  data_pagamento?: string;
  note?: string;
}

export interface Comunicazione {
  id: number;
  palazzina_id: number;
  titolo: string;
  contenuto: string;
  tipo: string;
  importante: boolean;
  autore_name: string;
  created_at: string;
}

export interface Documento {
  id: number;
  palazzina_id: number;
  nome: string;
  descrizione?: string;
  file_path: string;
  categoria?: string;
  uploaded_by_name: string;
  created_at: string;
}

// Auth
export const authService = {
  register: (email: string, name: string, googleId?: string, picture?: string) =>
    api.post('/auth/register', { email, name, googleId, picture }),
  google: (email: string, name: string, googleId: string, picture?: string) =>
    api.post('/auth/google', { email, name, googleId, picture }),
  getMe: () => api.get('/auth/me'),
};

// Palazzine
export const palazzineService = {
  getAll: () => api.get('/palazzine'),
  getById: (id: number) => api.get(`/palazzine/${id}`),
  create: (data: Partial<Palazzina>) => api.post('/palazzine', data),
  update: (id: number, data: Partial<Palazzina>) => api.put(`/palazzine/${id}`, data),
  delete: (id: number) => api.delete(`/palazzine/${id}`),
};

// Appartamenti
export const appartamentiService = {
  getByPalazzina: (palazzinaId: number) =>
    api.get(`/appartamenti/palazzina/${palazzinaId}`),
  create: (data: Partial<Appartamento>) => api.post('/appartamenti', data),
  update: (id: number, data: Partial<Appartamento>) =>
    api.put(`/appartamenti/${id}`, data),
  delete: (id: number) => api.delete(`/appartamenti/${id}`),
};

// Spese
export const speseService = {
  getByPalazzina: (palazzinaId: number) =>
    api.get(`/spese/palazzina/${palazzinaId}`),
  create: (data: Partial<Spesa>) => api.post('/spese', data),
  updatePagamento: (id: number, data: Partial<Pagamento>) =>
    api.put(`/spese/pagamento/${id}`, data),
  getSaldo: (appartamentoId: number) =>
    api.get(`/spese/saldo/${appartamentoId}`),
};

// Comunicazioni
export const comunicazioniService = {
  getByPalazzina: (palazzinaId: number) =>
    api.get(`/comunicazioni/palazzina/${palazzinaId}`),
  create: (data: Partial<Comunicazione>) => api.post('/comunicazioni', data),
  update: (id: number, data: Partial<Comunicazione>) =>
    api.put(`/comunicazioni/${id}`, data),
  delete: (id: number) => api.delete(`/comunicazioni/${id}`),
};

// Documenti
export const documentiService = {
  getByPalazzina: (palazzinaId: number) =>
    api.get(`/documenti/palazzina/${palazzinaId}`),
  upload: (formData: FormData) => api.post('/documenti/upload', formData),
  download: (id: number) => api.get(`/documenti/download/${id}`, { responseType: 'blob' }),
  delete: (id: number) => api.delete(`/documenti/${id}`),
};
