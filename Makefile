.PHONY: help setup build up down restart logs shell install dev prod clean

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

help: ## Hiển thị trợ giúp
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

setup: ## Setup và khởi động dự án lần đầu
	@chmod +x setup.sh
	@./setup.sh

build: ## Build Docker containers
	@echo "$(GREEN)Building containers...$(RESET)"
	@docker-compose build

up: ## Start containers (development)
	@echo "$(GREEN)Starting development containers...$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Containers started!$(RESET)"
	@echo "$(YELLOW)Visit: http://localhost:3000$(RESET)"

down: ## Stop và xóa containers
	@echo "$(YELLOW)Stopping containers...$(RESET)"
	@docker-compose down

restart: ## Restart containers
	@echo "$(YELLOW)Restarting containers...$(RESET)"
	@docker-compose restart
	@echo "$(GREEN)✅ Containers restarted!$(RESET)"

logs: ## Xem logs của app container
	@docker-compose logs -f app

logs-all: ## Xem logs tất cả containers
	@docker-compose logs -f

ps: ## Xem status containers
	@docker-compose ps

shell: ## Vào shell của app container
	@docker-compose exec app sh

shell-root: ## Vào shell với quyền root
	@docker-compose exec -u root app sh

install: ## Cài đặt dependencies
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@docker-compose exec app npm install

dev: ## Chạy development mode
	@docker-compose exec app npm run dev

build-app: ## Build Next.js app
	@echo "$(GREEN)Building Next.js application...$(RESET)"
	@docker-compose exec app npm run build

prod: ## Start production mode
	@echo "$(GREEN)Starting production containers...$(RESET)"
	@docker-compose --profile production up -d
	@echo "$(GREEN)✅ Production started!$(RESET)"
	@echo "$(YELLOW)Visit: http://localhost$(RESET)"

prod-down: ## Stop production containers
	@docker-compose --profile production down

clean: ## Xóa containers, volumes và cache
	@echo "$(YELLOW)Cleaning up...$(RESET)"
	@docker-compose down -v
	@rm -rf node_modules .next
	@echo "$(GREEN)✅ Cleanup complete!$(RESET)"

rebuild: ## Rebuild containers từ đầu
	@echo "$(YELLOW)Rebuilding containers...$(RESET)"
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d
	@echo "$(GREEN)✅ Rebuild complete!$(RESET)"

update: ## Update code và restart
	@echo "$(GREEN)Updating application...$(RESET)"
	@git pull
	@docker-compose exec app npm install
	@docker-compose restart app
	@echo "$(GREEN)✅ Update complete!$(RESET)"

backup: ## Backup data/events.json
	@echo "$(GREEN)Creating backup...$(RESET)"
	@mkdir -p backups
	@cp data/events.json backups/events_$(shell date +%Y%m%d_%H%M%S).json
	@echo "$(GREEN)✅ Backup created in backups/$(RESET)"

restore: ## Restore từ backup (file=backups/events_xxx.json)
	@if [ -z "$(file)" ]; then \
		echo "$(YELLOW)Usage: make restore file=backups/events_xxx.json$(RESET)"; \
	else \
		cp $(file) data/events.json; \
		echo "$(GREEN)✅ Restored from $(file)$(RESET)"; \
	fi

stats: ## Xem thống kê container
	@docker stats --no-stream

prune: ## Xóa tất cả Docker data không dùng
	@echo "$(YELLOW)⚠️  This will remove ALL unused Docker data!$(RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a --volumes; \
		echo "$(GREEN)✅ Docker cleanup complete!$(RESET)"; \
	fi

# Shortcuts
start: up ## Alias for 'up'
stop: down ## Alias for 'down'