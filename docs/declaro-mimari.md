# Declaro - Mimari Raporu

## Genel Bakis
Turk kurumlar vergisi beyanname yonetim sistemi. Monorepo yapisinda full-stack uygulama.

---

## Backend

| Katman | Teknoloji |
|--------|-----------|
| **Dil** | Python 3.12+ |
| **Framework** | FastAPI 0.115 |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Veritabani** | PostgreSQL 16 (asyncpg driver) |
| **Migration** | Alembic 1.13 (8 migration) |
| **Auth** | JWT (python-jose, HS256) + bcrypt |
| **Validation** | Pydantic 2.7 |
| **Rate Limit** | slowapi |
| **Excel Export** | openpyxl |
| **Formul Motoru** | simpleeval (vergi hesaplamalari) |
| **Paket Yoneticisi** | uv |
| **Test** | pytest + pytest-asyncio |

### API Routerlar (11 adet)
- `auth` - Login, register, token
- `users` - Kullanici yonetimi (admin)
- `admin` - Admin istatistik ve islemleri
- `admin_katalog` - Katalog yonetimi
- `mukellef` - Sirket (mukellef) CRUD
- `donem` - Vergi donemi CRUD
- `calisma` - Calisma oturumu yonetimi
- `kalem` - Vergi kalemi satirlari
- `hesaplama` - Vergi hesaplama endpointleri
- `katalog` - Katalog arama
- `export` - Excel export

### Veritabani Modelleri (8 adet)
- **User** - Kimlik dogrulama, roller (user/admin)
- **Mukellef** - Sirketler (VKN, unvan, vergi dairesi, KV orani)
- **Donem** - Vergi donemleri (yil bazli)
- **Calisma** - Beyanname calisma oturumlari
- **KalemVerisi** - Vergi kalemi satir verileri (JSON veri)
- **KalemOverride** - Ozel deger gecersiz kilmalari
- **AnaKategori** - Ust duzey vergi kategorileri
- **MukellefYetki** - Kullanici-sirket yetki iliskisi

### Backend Dizin Yapisi
```
backend/
├── app/
│   ├── main.py                    # FastAPI app kurulumu
│   ├── config.py                  # Ayarlar & ortam yonetimi
│   ├── logging_config.py          # Loglama
│   ├── api/                       # 11 API router
│   ├── auth/                      # JWT & sifre hashleme
│   │   ├── security.py
│   │   └── deps.py
│   ├── db/                        # Veritabani katmani
│   │   ├── session.py             # AsyncSession fabrikasi
│   │   ├── base.py                # DeclarativeBase
│   │   └── models/                # 8 ORM model
│   ├── schemas/                   # Pydantic request/response
│   ├── middleware/                 # Guvenlik header'lari
│   ├── katalog/                   # YAML kalem yukleme & cache
│   ├── formul_motoru/             # Formul degerlendirme motoru
│   ├── pipeline/                  # Hesaplama pipeline'i
│   └── export/                    # Excel olusturma
├── alembic/                       # Migration'lar (8 versiyon)
├── tests/                         # pytest test suite
├── pyproject.toml                 # Bagimliliklar (23 core + 6 dev)
└── Dockerfile                     # Python 3.12-slim
```

### Temel Backend Bagimliliklari
| Paket | Versiyon | Amac |
|-------|----------|------|
| fastapi | 0.115.0+ | Web framework |
| uvicorn | 0.30.0+ | ASGI server |
| sqlalchemy | 2.0.0+ | ORM & async destek |
| asyncpg | 0.29.0+ | PostgreSQL async driver |
| alembic | 1.13.0+ | Veritabani migration |
| pydantic | 2.7.0+ | Veri dogrulama |
| pyyaml | 6.0.0+ | YAML parse (kalemler/parametreler) |
| simpleeval | 0.9.13+ | Dinamik formul hesaplama |
| openpyxl | 3.1.0+ | Excel export |
| passlib[bcrypt] | 1.7.4+ | Sifre hashleme |
| python-jose | 3.3.0+ | JWT token |
| slowapi | 0.1.9+ | Rate limiting |

---

## Frontend

| Katman | Teknoloji |
|--------|-----------|
| **Dil** | TypeScript 5.5 |
| **Framework** | React 18.3 |
| **Bundler** | Vite 5.3 |
| **Routing** | react-router-dom 6.26 |
| **Server State** | @tanstack/react-query 5.51 |
| **Client State** | Zustand 4.5 |
| **Form** | react-hook-form 7.52 + Zod 3.23 |
| **HTTP** | Axios 1.7 |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | lucide-react |
| **Unit Test** | Vitest 2.0 + Testing Library |
| **E2E Test** | Playwright 1.45 (6 test suite) |

### Sayfa Yapisi (Routing)
- `/login`, `/register` - Acik auth sayfalari
- `/` - Dashboard (korunmali)
- `/mukellef` - Sirket listesi & detay
- `/donem/{id}` - Vergi donemi detaylari
- `/calisma/{id}/wizard/{stepKey}` - Cok adimli sihirbaz
  - `donem-acilis` - Donem acilisi
  - `ana-kategori` - Ana kategori taramasi
  - `alt-kategori` - Alt kategori ayirma
- `/calisma/{id}/istek-listesi` - Istek listesi
- `/calisma/{id}/ozet` - Mali kar ozeti
- `/calisma/{id}/kalem/{icKod}` - Kalem detay
- `/profile` - Kullanici profili
- `/admin/users`, `/admin/katalog` - Admin sayfalari

### State Yonetimi
- **Zustand:** useAuth (kullanici, token, login/logout), wizardStore (sihirbaz adim durumu)
- **React Query:** Server state caching, arka plan senkronizasyonu, otomatik yeniden fetch

### Frontend Dizin Yapisi
```
frontend/
├── src/
│   ├── main.tsx                   # Uygulama girisi (QueryClientProvider)
│   ├── App.tsx                    # Ana router, korunmali rotalar
│   ├── api/                       # Axios API istemci katmani
│   │   ├── client.ts              # Axios instance & interceptor'lar
│   │   ├── auth.ts, admin.ts, mukellef.ts, ...
│   ├── components/
│   │   ├── Layout.tsx             # Ana layout
│   │   ├── ProtectedRoute.tsx     # Auth guard
│   │   ├── AdminRoute.tsx         # Admin guard
│   │   ├── ui/                    # Yeniden kullanilabilir UI bilesenler
│   │   ├── admin/                 # Admin bilesenler
│   │   └── kalem/                 # Kalem gosterim bilesenler
│   ├── pages/                     # Sayfa bilesenleri (rota bazli)
│   ├── hooks/                     # useAuth, useTheme vb.
│   ├── store/                     # Zustand store'lari
│   ├── types/                     # TypeScript interface'ler
│   ├── lib/                       # Yardimci fonksiyonlar
│   └── config/                    # Yapilandirma
├── e2e/                           # Playwright E2E testleri (6 suite)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
└── Dockerfile                     # Node 20-alpine
```

### Temel Frontend Bagimliliklari
| Paket | Versiyon | Amac |
|-------|----------|------|
| react | 18.3.1+ | UI kutuphanesi |
| typescript | 5.5.3+ | Tip guvenligi |
| vite | 5.3.4+ | Bundler |
| react-router-dom | 6.26.0+ | Client-side routing |
| @tanstack/react-query | 5.51.0+ | Server state caching |
| zustand | 4.5.0+ | State yonetimi |
| react-hook-form | 7.52.0+ | Form yonetimi |
| zod | 3.23.0+ | Schema dogrulama |
| axios | 1.7.0+ | HTTP istemci |
| tailwindcss | 3.4.7+ | Utility CSS |
| lucide-react | 0.400.0+ | Ikon kutuphanesi |

---

## Veritabani

| Ozellik | Deger |
|---------|-------|
| **Tip** | PostgreSQL 16 (Alpine) |
| **Port** | 5433 (dis) → 5432 (ic) |
| **Driver** | asyncpg (async) |
| **Baglanti** | Connection pooling + pre-ping |
| **Persistence** | Named volume (`postgres_data`) |
| **Health Check** | `pg_isready` (10s aralik, 5 tekrar) |
| **Migration** | Alembic (8 versiyon) |

---

## DevOps & Deployment

### Docker Compose (3 Servis)
```
postgres (16-alpine)
  ├── Volume: postgres_data
  ├── Port: 127.0.0.1:5433:5432
  └── Health check: pg_isready

backend (python:3.12-slim)
  ├── Volume: ./backend:/app, ./kalemler, ./parametreler
  ├── Port: 8001:8000
  ├── Depends: postgres (healthy)
  └── .env injection

frontend (node:20-alpine)
  ├── Volume: ./frontend:/app
  ├── Port: 5173:5173
  ├── NODE_ENV=development
  └── Depends: backend
```

### Makefile Komutlari
- `make up` - Build & baslatma
- `make start` - Rebuild olmadan baslatma
- `make down` - Durdurma
- `make logs` - Log takibi
- `make migrate` - Migration uygulama
- `make migration m="mesaj"` - Migration olusturma
- `make shell-backend` - Backend shell
- `make shell-db` - PostgreSQL shell
- `make db-reset` - Veritabani sifirlama
- `make clean` - Container & volume silme

### Ortam Degiskenleri (.env)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `DATABASE_URL` (async PostgreSQL baglanti dizesi)
- `SECRET_KEY` (JWT imzalama anahtari)
- `ENVIRONMENT` (development/production)

---

## Domain Mimarisi

### Vergi Kalem Sistemi
- **kalemler/** dizini: 500+ YAML dosyasi (vergi kalem tanimlari)
- **parametreler/** dizini: Global vergi parametreleri (oranlar, limitler, esikler, tarihler)
- **Katalog sistemi:** Baslangicta yuklenir, bellekte cache'lenir, aranabilir

### Hesaplama Pipeline'i
```
Kalem Verisi → Formul Motoru (simpleeval) → Hesaplama Sonucu → Excel Export
```

### Multi-Tenant Mimari
- Kullanicilar birden fazla sirket (Mukellef) yonetebilir
- MukellefYetki tablosu ile erisim kontrolu
- Admin kullanicilar tum sirket ve kullanicilari yonetebilir
- Veri izolasyonu: Sorgular kullanici sahipligi veya admin statusune gore filtrelenir

### Beyanname Sihirbazi (3 Faz)
1. **Donem Acilis** - Vergi donemi baslangic ayarlari
2. **Ana Kategori Taramasi** - Ust duzey vergi kategorileri
3. **Alt Kategori Ayirma** - Detayli kalem islemleri

### Kimlik Dogrulama & Yetkilendirme
- JWT tabanli (30 dk sureli)
- Rol bazli erisim kontrolu (user/admin)
- ProtectedRoute & AdminRoute bilesenleri ile rota korumasi
- localStorage'da token saklama (`declaro-auth-token`)

---

## Test Altyapisi

### Backend
- **Framework:** pytest 8.0 + pytest-asyncio
- **Tipler:** Unit (katalog, formul, pipeline) + API entegrasyon
- **Fixture:** AsyncClient, mock auth
- **Komut:** `pytest`

### Frontend
- **Unit/Component:** Vitest 2.0 + @testing-library/react
  - jsdom ortami, %80 coverage esigi
- **E2E:** Playwright 1.45
  - 6 test suite (home, mukellef, wizard, kalem, ozet, donem-detay)
  - Chromium, HTML raporlama, hata ekran goruntusu

---

## Ozet Tablo

| | Declaro |
|---|---|
| **Backend** | Python 3.12 / FastAPI |
| **Frontend** | TypeScript / React 18 |
| **DB** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2 (async) |
| **Auth** | JWT + bcrypt |
| **State** | Zustand + React Query |
| **Styling** | Tailwind CSS |
| **Build** | Vite + Docker Compose |
| **Test** | pytest + Vitest + Playwright |
| **CI/CD** | Henuz yok |
