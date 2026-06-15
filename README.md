# 🏢 MiniCondominio

Web app responsiva per la gestione di condomini e palazzine. Registra spese comuni, gestisci appartamenti, carica documenti e visualizza saldi.

## ✨ Funzionalità

- 🔐 **Autenticazione Google OAuth**
- 🏠 **Gestione Palazzine** - Registra e gestisci condomini
- 🚪 **Gestione Appartamenti** - Assegna e monitora proprietà
- 💰 **Spese Comuni** - Traccia e distribuisci costi
- 📄 **Gestione Documenti** - Upload e archiviazione PDF
- 📢 **Comunicazioni** - Bacheca pubblica e notifiche
- 📊 **Dashboard Amministrativa** - Analytics e reportistica
- 📱 **Responsive Design** - Mobile-first
- 🇮🇹 **Interfaccia Italiana**

## 🛠️ Tech Stack

### Backend
- Node.js 18+
- Express.js
- SQLite3
- TypeScript
- JWT + Google OAuth

### Frontend
- React 18+
- Vite
- TypeScript
- TailwindCSS
- Axios

## 📦 Installazione

### Prerequisiti
- Node.js 18+
- npm o yarn

### Setup Locale

```bash
# Clone repository
git clone https://github.com/criky20190-ship-it/minicondominio.git
cd minicondominio

# Setup Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Setup Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## 📝 Variabili Ambiente

Vedi `.env.example` in root per configurazione completa.

```
PORT=5000
DATABASE_URL=./data/condominio.db
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🚀 Deploy su VPS

```bash
# Build
cd backend && npm run build
cd ../frontend && npm run build

# Usa docker-compose o PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

Vedi `DEPLOY.md` per istruzioni dettagliate.

## 📄 Licenza

MIT
