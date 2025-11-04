# Makefile for Shanthi Online Gold

.PHONY: help build deploy start stop restart logs status clean update shell

help: ## Show this help message
	@echo "Shanthi Online Gold - Deployment Commands"
	@echo "=========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "📦 Building Docker images..."
	docker-compose build --no-cache

deploy: build ## Build and deploy the application
	@echo "🚀 Deploying application..."
	docker-compose up -d
	@echo "✅ Deployment complete!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:9000"

start: ## Start containers
	@echo "🚀 Starting containers..."
	docker-compose up -d
	@docker-compose ps

stop: ## Stop containers
	@echo "⏸️  Stopping containers..."
	docker-compose down
	@echo "✅ Containers stopped!"

restart: ## Restart containers
	@echo "🔄 Restarting containers..."
	docker-compose restart
	@docker-compose ps

logs: ## View logs (Ctrl+C to exit)
	docker-compose logs -f

status: ## Check status of containers and services
	@echo "📊 Container Status:"
	@docker-compose ps
	@echo ""
	@echo "🔍 Health Checks:"
	@echo -n "Backend: "
	@curl -f http://localhost:9000/healthz 2>/dev/null && echo "✅ OK" || echo "❌ Failed"
	@echo -n "Frontend: "
	@curl -f http://localhost:3000 2>/dev/null > /dev/null && echo "✅ OK" || echo "❌ Failed"

clean: ## Stop containers and clean up resources
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete!"

update: ## Pull latest code and rebuild
	@echo "🔄 Updating application..."
	git pull origin main
	@make deploy
	@echo "✅ Update complete!"

shell: ## Open shell in the container
	docker-compose exec app sh

backend-logs: ## View backend logs only
	docker-compose logs -f app

env-check: ## Verify environment configuration
	@echo "🔍 Checking environment files..."
	@test -f backend/.env.staging && echo "✅ backend/.env.staging exists" || echo "❌ backend/.env.staging missing"
	@test -f frontend/.env.production && echo "✅ frontend/.env.production exists" || echo "⚠️  frontend/.env.production missing (optional)"

test-backend: ## Test backend health
	@curl -f http://localhost:9000/healthz && echo " ✅ Backend is healthy" || echo " ❌ Backend is not responding"

test-frontend: ## Test frontend
	@curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend is accessible" || echo "❌ Frontend is not responding"

backup-uploads: ## Backup uploads directory
	@echo "💾 Backing up uploads..."
	@tar -czf uploads-backup-$$(date +%Y%m%d-%H%M%S).tar.gz backend/uploads
	@echo "✅ Backup created: uploads-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"

.DEFAULT_GOAL := help
