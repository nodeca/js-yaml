PATH        := ./node_modules/.bin:${PATH}

NPM_PACKAGE := $(shell node -e 'process.stdout.write(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'process.stdout.write(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut -b -6) master)
GITHUB_PROJ := https://github.com/nodeca/${NPM_PACKAGE}


help:
	echo "make help       - Print this help"
	echo "make lint       - Lint sources with JSHint"
	echo "make test       - Lint sources and run all tests"
	echo "make browserify - Build browserified version"
	echo "make dev-deps   - Install developer dependencies"
	echo "make gh-pages   - Build and push API docs into gh-pages branch"
	echo "make publish    - Set new version tag and publish npm package"
	echo "make todo       - Find and list all TODOs"


lint:
	if test ! `which jshint` ; then \
		echo "You need 'jshint' installed in order to run lint." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	jshint . --show-non-errors


test: lint
	@if test ! `which mocha` ; then \
		echo "You need 'mocha' installed in order to run tests." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	NODE_ENV=test mocha -R spec


dev-deps:
	@if test ! `which npm` ; then \
		echo "You need 'npm' installed." >&2 ; \
		echo "  See: http://npmjs.org/" >&2 ; \
		exit 128 ; \
		fi
	npm install -g jshint
	npm install


gh-pages:
	@if test -z ${REMOTE_REPO} ; then \
		echo 'Remote repo URL not found' >&2 ; \
		exit 128 ; \
		fi
	mkdir ${TMP_PATH}
	cp -r demo/* ${TMP_PATH}
	touch ${TMP_PATH}/.nojekyll
	cd ${TMP_PATH} && \
		git init && \
		git add . && \
		git commit -q -m 'Updated browserified demo'
	cd ${TMP_PATH} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages
	rm -rf ${TMP_PATH}


publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish ${GITHUB_PROJ}/tarball/${NPM_VERSION}


browserify:
	if test ! `which browserify` ; then npm install browserify ; fi
	if test ! `which uglifyjs` ; then npm install uglify-js ; fi
	rm -rf ./dist
	mkdir dist
	# Browserify
	( echo -n "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" ; \
		browserify -r ./ -s jsyaml -x esprima \
		) > dist/js-yaml.js
	# Minify
	uglifyjs dist/js-yaml.js -c -m \
		--preamble "/* ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} */" \
		> dist/js-yaml.min.js
	# Update browser demo
	cp dist/js-yaml.js demo/js/


todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true


.PHONY: publish lint test dev-deps gh-pages todo
.SILENT: help lint test todo
