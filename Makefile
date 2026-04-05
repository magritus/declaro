.PHONY: up down build restart logs migrate shell-backend shell-db

# Servisleri başlat (rebuild ile)
up:
	docker compose up --build -d

# Servisleri başlat (rebuild olmadan, hızlı)
start:
	docker compose up -d

# Servisleri durdur
down:
	docker compose down

# Container'ları yeniden build et
build:
	docker compose build

# Tüm servisleri yeniden başlat
restart:
	docker compose restart

# Log'ları takip et (tüm servisler)
logs:
	docker compose logs -f

# Sadece backend log'ları
logs-backend:
	docker compose logs -f backend

# Sadece frontend log'ları
logs-frontend:
	docker compose logs -f frontend

# Alembic migration'ları uygula
migrate:
	docker compose exec backend alembic upgrade head

# Yeni migration oluştur (m="mesaj" ile)
# Kullanım: make migration m="add_new_table"
migration:
	docker compose exec backend alembic revision --autogenerate -m "$(m)"

# Backend container'ına shell aç
shell-backend:
	docker compose exec backend bash

# PostgreSQL'e psql ile bağlan
shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

# Veritabanını sıfırla (dikkat!)
db-reset:
	docker compose down -v
	docker compose up -d postgres
	sleep 3
	docker compose exec backend alembic upgrade head

# Frontend bağımlılıklarını yükle (container içinde)
npm-install:
	docker compose exec frontend npm install

# Tüm container'ları, volume'ları ve image'ları temizle
clean:
	docker compose down -v --rmi local
