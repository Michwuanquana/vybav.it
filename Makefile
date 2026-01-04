# Vybaveno Makefile

.PHONY: dev build deploy-dev deploy-prod

# Spustí lokální vývojový server
dev:
	cd www && npm run dev

# Sestaví projekt
build:
	cd www && npm run build

# Nasadí na vývojové prostředí (lokální Docker)
deploy-dev:
	docker-compose down && docker-compose up -d --build www

# Nasadí na produkční prostředí
deploy-prod:
	docker-compose down && docker-compose up -d --build www
