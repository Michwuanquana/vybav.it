# Vybaveno Makefile

.PHONY: dev build deploy-dev deploy-prod

# Spustí lokální vývojový server
dev:
	cd www && npm run dev

# Sestaví projekt
build:
	cd www && npm run build

# Nasadí na vývojové prostředí (preview)
deploy-dev:
	cd www && npx vercel

# Nasadí na produkční prostředí
deploy-prod:
	cd www && npx vercel --prod
