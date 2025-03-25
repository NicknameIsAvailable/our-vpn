start:
	@echo "destroying previous build"

build:
	docker compose down --rmi all --remove-orphans
	docker system prune -a -f
	docker compose up --build -d
