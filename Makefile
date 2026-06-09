.PHONY: help dev build preview check test fmt clean install

# Default target: show help
help:
	@echo "Json Studio (Web) development commands"
	@echo ""
	@echo "  make dev          - Start the Vite dev server"
	@echo "  make build        - Build the static site into build/"
	@echo "  make preview      - Preview the built site locally"
	@echo "  make check        - Type check"
	@echo "  make test         - Run tests"
	@echo "  make fmt          - Format frontend code"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make install      - Install dependencies"

dev:
	pnpm dev

build:
	pnpm build

preview:
	pnpm preview

check:
	pnpm check

test:
	pnpm test

fmt:
	pnpm exec prettier --write "src/**/*.{ts,js,svelte}" 2>/dev/null || true

clean:
	rm -rf build
	rm -rf node_modules/.vite

install:
	pnpm install
