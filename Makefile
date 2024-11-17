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

version:
	@python -c 'import setuptools_scm; print(setuptools_scm.get_version().split("+")[0])'
