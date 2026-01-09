# ------------------------------------------------------------------------------
# Makefile for building and managing the k8shell docs Docker image
# ------------------------------------------------------------------------------

# Image configuration
IMAGE_NAME ?= k8shell-docs
IMAGE_REPO ?= fitcr.ksi.in.fit.cvut.cz/k8shell-system/$(IMAGE_NAME)
DOCKERFILE ?= docker/docs/Dockerfile
BUILD_CONTEXT ?= docker/docs
FILES_DIR := $(BUILD_CONTEXT)/files

# Tagging
TAG := $(shell git describe --tags --match "v*" 2>/dev/null | sed -E 's/-g[0-9a-f]{7,}$$//')
FULL_IMAGE   := $(IMAGE_REPO):$(TAG)
LATEST       := $(IMAGE_REPO):latest

# ------------------------------------------------------------------------------
# Targets
# ------------------------------------------------------------------------------

.PHONY: all prepare build push clean

prepare:
	@echo "Preparing Docker build context in $(FILES_DIR)"
	rm -rf $(FILES_DIR)
	mkdir -p $(FILES_DIR)

	# Copy essential project files
	cp -r docs $(FILES_DIR)/
	cp -r src $(FILES_DIR)/
	#cp -r static $(FILES_DIR)/ 2>/dev/null || true
	cp -r plugins $(FILES_DIR)/
	cp -r drawings $(FILES_DIR)/ 2>/dev/null || true
	cp -r bin $(FILES_DIR)/ 2>/dev/null || true

	# Copy configs and manifests
	cp package.json package-lock.json tsconfig.json $(FILES_DIR)/
	cp docusaurus.config.* $(FILES_DIR)/ 2>/dev/null || true
	cp sidebars.ts $(FILES_DIR)/ 2>/dev/null || true
	cp README.md $(FILES_DIR)/ 2>/dev/null || true
        echo "TAG: $$TAG"

	@echo "Build context ready."

image: prepare
	@echo "Building Docker image $(FULL_IMAGE)"
	docker build -t $(FULL_IMAGE) -f $(DOCKERFILE) $(BUILD_CONTEXT)
	@echo "Image built: $(FULL_IMAGE)"
	@echo "Tagging as latest"
	docker tag $(FULL_IMAGE) $(LATEST)

push: image
	@echo "Pushing images to $(IMAGE_REPO)"
	docker push $(FULL_IMAGE)
	docker push $(LATEST)
	@echo "Pushed: $(FULL_IMAGE) and $(LATEST)"

make tag:
	@echo "$(TAG)"

clean:
	@echo "Cleaning up..."
	rm -rf $(FILES_DIR)
	docker rmi -f $(FULL_IMAGE) $(LATEST) || true
	@echo "Clean complete."

help:
	@echo "Available targets:"
	@echo "  make prepare     - Copy source files to docker/docs/files"
	@echo "  make image       - Build Docker image"
	@echo "  make push        - Build and push image to registry"
	@echo "  make clean       - Remove local Docker images and files"
	@echo "  make help        - Show this help message"
