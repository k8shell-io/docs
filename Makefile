# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = .
BUILDDIR      = _build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

image:
	rm -fr _build
	$(MAKE) html
	rm -fr docker/docs/files
	mkdir -p docker/docs/files
	cp -r _build/html/* docker/docs/files
	cd docker/docs && docker build -t docs:latest .

run:
	$(MAKE) image
	@-docker rm -f k8shell-docs &>/dev/null
	@sleep 1
	@docker run -d --name k8shell-docs -p 8080:80 docs:latest
	@docker image prune -f

# Increment the version
# args: the part to increment (minor or patch)
inc-version:
	@latest_tag=$$(git describe --tags `git rev-list --tags --max-count=1`); \
	if [ -z "$$latest_tag" ]; then \
		echo "Error: No tags found."; \
		exit 1; \
	fi; \
	major_minor_patch=$$(echo $$latest_tag | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'); \
	echo "latest tag: $$major_minor_patch"; \
	major=$$(echo $$major_minor_patch | cut -d. -f1); \
	minor=$$(echo $$major_minor_patch | cut -d. -f2); \
	patch=$$(echo $$major_minor_patch | cut -d. -f3); \
	if [ "$(PART)" = "minor" ]; then \
		new_minor=$$((minor + 1)); \
		new_tag="v$$major.$$new_minor.0"; \
	elif [ "$(PART)" = "patch" ]; then \
		new_patch=$$((patch + 1)); \
		new_tag="v$$major.$$minor.$$new_patch"; \
	fi; \
	echo "Creating new tag: $$new_tag"; \
	git tag -a $$new_tag -m "release version $$new_tag"; \
	git push origin $$new_tag

# Increment the minor version
inc-minor:
	$(MAKE) PART=minor inc-version

# Increment the patch version
inc-patch:
	$(MAKE) PART=patch inc-version

version:
	@python -c 'import setuptools_scm; print(setuptools_scm.get_version().split("+")[0])'
