# Infrastructure Makefile
# Usage:
#   make deploy-local       - Run locally with Docker Compose
#   make build-all          - Build all production images
#   make push-all           - Push all images to registry
#
# Variables:
#   REGISTRY    - Docker registry URL (default: gcr.io/agencyos-prod)
#   TAG         - Image tag (default: latest)

REGISTRY ?= gcr.io/agencyos-prod
TAG ?= latest

.PHONY: help deploy-local down logs build-engine build-worker push-engine push-worker build-all push-all

help:
	@echo "AgencyOS Infrastructure Management"
	@echo "----------------------------------"
	@echo "make deploy-local  : Start local environment (Redis + Postgres + Apps)"
	@echo "make down          : Stop local environment"
	@echo "make logs          : View local logs"
	@echo "make build-all     : Build production Docker images"
	@echo "make push-all      : Push images to registry ($(REGISTRY))"

deploy-local:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# Docker Image Management
build-engine:
	docker build -t $(REGISTRY)/agency-engine:$(TAG) -f ../apps/engine/Dockerfile ../apps/engine

build-worker:
	docker build -t $(REGISTRY)/agency-worker:$(TAG) -f ../apps/worker/Dockerfile ../apps/worker

push-engine:
	docker push $(REGISTRY)/agency-engine:$(TAG)

push-worker:
	docker push $(REGISTRY)/agency-worker:$(TAG)

build-all: build-engine build-worker

push-all: push-engine push-worker
