PATH        := $(shell pwd)/node_modules/.bin:${PATH}

NPM_PACKAGE := $(shell node -e 'console.log(require("./package.json").name)')
NPM_VERSION := $(shell node -e 'console.log(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_PROJ := nodeca/${NPM_PACKAGE}
SRC_URL_FMT := https://github.com/${GITHUB_PROJ}/blob/${CURR_HEAD}/{file}\#L{line}

JS_FILES    := $(shell find ./bin ./lib ./test -type f -name '*.js' -print)

lint:
	@if test ! `which jslint` ; then \
		echo "You need 'jslint' installed in order to run lint." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	# (node)    -> Node.JS compatibility mode
	# (indent)  -> indentation level (2 spaces)
	# (nomen)   -> tolerate underscores in identifiers (e.g. `var _val = 1`)
	# (bitwise) -> tolerate bitwise operators (used in base64)
	# (white) 	-> tolerate messy whitespace
	jslint --node --nomen --bitwise --white --indent=2 ./index.js ${JS_FILES}

test: lint
	@if test ! `which vows` ; then \
		echo "You need 'vows' installed in order to run tests." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	NODE_ENV=test vows --spec

dev-deps:
	@if test ! `which npm` ; then \
		echo "You need 'npm' installed." >&2 ; \
		echo "  See: http://npmjs.org/" >&2 ; \
		exit 128 ; \
		fi
	npm install --dev

build: browserify uglify

browserify:
	if test ! `which browserify` ; then npm install browserify ; fi
	cp -r support/browserify/ ${TMP_PATH}
	browserify index.js -o ${TMP_PATH}/50_js-yaml.js
	cat ${TMP_PATH}/* > js-yaml.js
	rm -rf ${TMP_PATH}
	cp js-yaml.js demo/js/

uglify:
	if test ! `which uglifyjs` ; then npm install uglify-js ; fi
	uglifyjs js-yaml.js > js-yaml.min.js


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
		git commit -q -m 'Update browserified demo'
	cd ${TMP_PATH} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages 
	rm -rf ${TMP_PATH}

publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm publish https://github.com/${GITHUB_PROJ}/tarball/${NPM_VERSION}

todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true

.PHONY: publish test lint dev-deps gh-pages todo
.SILENT: todo test test-functional test-issues
