SHELL := /bin/bash

.PHONY: help install start dev migrate test build clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	poetry install

start: ## Start production server (Docker)
	docker-compose up -d --build

dev: ## Start development server
	poetry run uvicorn app.main:app --reload

worker: ## Start background worker
	poetry run arq app.worker.WorkerSettings

migrate: ## Run database migrations
	poetry run alembic upgrade head

migration: ## Create a new migration (usage: make migration msg="message")
	poetry run alembic revision --autogenerate -m "$(msg)"

test: ## Run tests
	poetry run pytest

clean: ## Clean up temporary files
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
