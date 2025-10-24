.PHONY: help setup build up down restart logs shell install dev prod clean

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RED    := $(shell tput -Txterm setaf 1)
RESET  := $(shell tput -Txterm sgr0)

help: ## Hiển thị trợ giúp
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ===================================
# SETUP
# ===================================
setup: ## Setup dự án lần đầu
	@chmod +x setup.sh deploy-prod.sh
	@./setup.sh

# ===================================
# DEVELOPMENT COMMANDS
# ===================================
build: ## Build development containers
	@echo "$(GREEN)Building development containers...$(RESET)"
	@docker-compose build app

up: ## Start development
	@echo "$(GREEN)Starting development...$(RESET)"
	@docker-compose up -d app
	@echo "$(GREEN)✅ Development started!$(RESET)"
	@echo "$(YELLOW)Visit: http://localhost:3000$(RESET)"

down: ## Stop development
	@echo "$(YELLOW)Stopping development...$(RESET)"
	@docker-compose down

restart: ## Restart development
	@echo "$(YELLOW)Restarting development...$(RESET)"
	@docker-compose restart app
	@echo "$(GREEN)✅ Restarted!$(RESET)"

logs: ## Xem logs development
	@docker-compose logs -f app

shell: ## Vào shell development container
	@docker-compose exec app sh

install: ## Install dependencies (development)
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@docker-compose exec app npm install

dev: ## Run dev mode
	@docker-compose exec app npm run dev

build-app: ## Build Next.js app (development)
	@echo "$(GREEN)Building Next.js...$(RESET)"
	@docker-compose exec app npm run build

# ===================================
# PRODUCTION COMMANDS
# ===================================
prod-build: ## Build production images
	@echo "$(GREEN)Building production images...$(RESET)"
	@docker-compose --profile production build --no-cache

prod: ## Start production
	@echo "$(GREEN)Starting production...$(RESET)"
	@docker-compose --profile production up -d
	@echo "$(GREEN)✅ Production started!$(RESET)"
	@echo "$(YELLOW)Visit: http://localhost$(RESET)"

prod-down: ## Stop production
	@echo "$(YELLOW)Stopping production...$(RESET)"
	@docker-compose --profile production down

prod-restart: ## Restart production
	@echo "$(YELLOW)Restarting production...$(RESET)"
	@docker-compose --profile production restart
	@echo "$(GREEN)✅ Production restarted!$(RESET)"

prod-logs: ## Xem logs production
	@docker-compose --profile production logs -f

prod-shell: ## Vào shell production container
	@docker-compose --profile production exec app-prod sh

prod-shell-root: ## Vào shell production (root)
	@docker-compose --profile production exec -u root app-prod sh

# ===================================
# DEPLOYMENT
# ===================================
deploy: ## Deploy production (rebuild + restart)
	@echo "$(GREEN)Deploying production...$(RESET)"
	@chmod +x deploy-prod.sh
	@./deploy-prod.sh

prod-update: ## Update code và deploy lại
	@echo "$(GREEN)Updating production...$(RESET)"
	@git pull
	@docker-compose --profile production down
	@docker-compose --profile production build --no-cache
	@docker-compose --profile production up -d
	@echo "$(GREEN)✅ Production updated!$(RESET)"

# ===================================
# UTILITIES
# ===================================
clean: ## Xóa containers và cache
	@echo "$(YELLOW)Cleaning up...$(RESET)"
	@docker-compose down -v
	@rm -rf node_modules .next
	@echo "$(GREEN)✅ Cleanup complete!$(RESET)"

rebuild: ## Rebuild development từ đầu
	@echo "$(YELLOW)Rebuilding development...$(RESET)"
	@docker-compose down
	@docker-compose build --no-cache app
	@docker-compose up -d app
	@echo "$(GREEN)✅ Rebuild complete!$(RESET)"

prod-rebuild: ## Rebuild production từ đầu
	@echo "$(YELLOW)Rebuilding production...$(RESET)"
	@docker-compose --profile production down
	@docker-compose --profile production build --no-cache
	@docker-compose --profile production up -d
	@echo "$(GREEN)✅ Production rebuild complete!$(RESET)"

ps: ## Xem status containers
	@docker-compose ps -a

stats: ## Xem thống kê containers
	@docker stats --no-stream

backup: ## Backup data/events.json
	@echo "$(GREEN)Creating backup...$(RESET)"
	@mkdir -p backups
	@cp data/events.json backups/events_$(shell date +%Y%m%d_%H%M%S).json
	@echo "$(GREEN)✅ Backup created!$(RESET)"

# Shortcuts
start: up
stop: down