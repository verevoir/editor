.PHONY: build test run

build: ## Compile TypeScript
	npx tsup

test: ## Run test suite
	npx vitest run

run: ## No-op (library)
	@echo "@nextlake/editor is a library, not a service."
