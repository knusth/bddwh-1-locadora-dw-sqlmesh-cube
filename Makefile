.PHONY: help up down migrate generate-data generate-data-large generate-data-small clean-db sqlmesh-plan sqlmesh-apply sqlmesh-info clean logs psql psql-dwh bootstrap cube-status cube-logs

# Cores para output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Mostra esta ajuda
	@echo "$(BLUE)Locadora DW - Pipeline de Desenvolvimento$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

up: ## Sobe toda a stack (OLTP + DWH + pgAdmin + Cube)
	@echo "$(BLUE)Subindo stack completa...$(RESET)"
	docker-compose up -d postgres postgres-dwh pgadmin cube
	@echo "$(GREEN)✓ Stack no ar$(RESET)"
	@echo "  OLTP:  localhost:5434  (db: locadora_dw)"
	@echo "  DWH:   localhost:5433  (db: locadora_dwh)"
	@echo "  Admin: http://localhost:5050  (admin@locadora.dw / admin123)"
	@echo "  Cube:  http://localhost:4000  (Playground)"

down: ## Derruba toda a stack
	@echo "$(YELLOW)Derrubando stack...$(RESET)"
	docker-compose down
	@echo "$(GREEN)✓ Stack derrubada$(RESET)"

migrate: ## Executa migrations no banco OLTP
	@echo "$(BLUE)Executando migrations...$(RESET)"
	docker-compose --profile migrations run --rm migrations
	@echo "$(GREEN)✓ Migrations aplicadas$(RESET)"


generate-data: ## Gera dados fake realistas no OLTP (escala medium)
	@echo "$(BLUE)Gerando dados sintéticos...$(RESET)"
	docker-compose --profile generator run --rm generator --scale medium
	@echo "$(GREEN)✓ Dados gerados$(RESET)"

generate-data-large: ## Gera dados fake em escala grande
	@echo "$(BLUE)Gerando dados sintéticos em escala grande...$(RESET)"
	docker-compose --profile generator run --rm generator --scale large
	@echo "$(GREEN)✓ Dados gerados$(RESET)"

generate-data-small: ## Gera dados fake em escala pequena
	@echo "$(BLUE)Gerando dados sintéticos em escala pequena...$(RESET)"
	docker-compose --profile generator run --rm generator --scale small
	@echo "$(GREEN)✓ Dados gerados$(RESET)"

clean-db: ## Limpa (trunca) todas as tabelas do OLTP
	@echo "$(YELLOW)Limpando banco OLTP...$(RESET)"
	docker-compose --profile generator run --rm generator --clean
	@echo "$(GREEN)✓ Banco limpo$(RESET)"

sqlmesh-plan: ## Executa sqlmesh plan no ambiente dev
	@echo "$(BLUE)Executando SQLMesh plan...$(RESET)"
	docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh plan dev

sqlmesh-apply: ## Executa sqlmesh apply no ambiente dev
	@echo "$(BLUE)Executando SQLMesh apply...$(RESET)"
	docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh plan dev --auto-apply

sqlmesh-info: ## Mostra informações do projeto SQLMesh
	@echo "$(BLUE)SQLMesh Info...$(RESET)"
	docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh info

psql: ## Acessa o psql do OLTP
	docker-compose exec postgres psql -U locadora_admin -d locadora_dw

psql-dwh: ## Acessa o psql do DWH
	docker-compose exec postgres-dwh psql -U locadora_admin -d locadora_dwh

logs: ## Mostra logs dos serviços
	docker-compose logs -f

cube-status: ## Status do Cube.dev
	@echo "$(BLUE)Cube.dev Status$(RESET)"
	@docker-compose ps cube
	@echo "$(GREEN)Playground: http://localhost:4000$(RESET)"

cube-logs: ## Logs do Cube.dev
	docker-compose logs -f cube

clean: ## Remove volumes e containers (⚠️ perde dados!)
	@echo "$(RED)⚠ Removendo volumes e containers...$(RESET)"
	docker-compose down -v
	docker volume rm -f p1_postgres_data p1_pgadmin_data p1_postgres_dwh_data 2>/dev/null || true
	@echo "$(GREEN)✓ Limpo$(RESET)"

bootstrap: ## Bootstrap completo: sobe stack, roda migrations e gera dados
	@echo "$(BLUE)🚀 Bootstrap completo do projeto...$(RESET)"
	$(MAKE) up
	@echo "$(BLUE)Aguardando bancos ficarem prontos...$(RESET)"
	@sleep 5
	$(MAKE) migrate
	$(MAKE) generate-data
	@echo ""
	@echo "$(GREEN)✅ Projeto pronto!$(RESET)"
	@echo "$(BLUE)Serviços disponíveis:$(RESET)"
	@echo "  OLTP:    localhost:5434"
	@echo "  DWH:     localhost:5433"
	@echo "  pgAdmin: http://localhost:5050"
	@echo "  Cube:    http://localhost:4000"
	@echo ""
	@echo "$(BLUE)Próximos passos:$(RESET)"
	@echo "  make sqlmesh-plan   # para planejar o DWH"
	@echo "  make sqlmesh-apply  # para aplicar o DWH"
