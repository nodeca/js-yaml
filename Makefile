PATH        := ./node_modules/.bin:${PATH}

PROJECT     :=  $(notdir ${PWD})
TMP_PATH    := /tmp/${PROJECT}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD 	:= $(firstword $(shell git show-ref --hash HEAD | cut --bytes=-6) master)
GITHUB_NAME := nodeca/js-yaml
SRC_URL_FMT := https://github.com/${GITHUB_NAME}/blob/${CURR_HEAD}/{file}\#L{line}

lint:
	@if test ! `which jslint` ; then \
		echo "You need 'jslint' installed in order to generate docs." >&2 ; \
		echo "  $ make dev-deps" >&2 ; \
		exit 128 ; \
		fi
	# (node)    -> Node.JS compatibility mode
	# (indent)  -> indentation level (2 spaces)
	# (nomen)   -> tolerate underscores in identifiers (e.g. `var _val = 1`)
	jslint --node --nomen --indent=2 ./lib/*.js ./lib/**/*.js

test: lint test-issues test-functional

test-functional:
	echo 
	echo "## FUNCTIONAL ##################################################################"
	echo "################################################################################"
	echo 
	node ./test/functional/run.js
	echo 

test-issues:
	echo 
	echo "## ISSUES ######################################################################"
	echo "################################################################################"
	echo 
	node ./test/issues/run.js
	echo 

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
	cp -r support/browserify/ ${TMP_DIR}
	browserify index.js -o ${TMP_DIR}/50_js-yaml.js
	cat ${TMP_DIR}/* > js-yaml.js
	rm -rf ${TMP_DIR}
	cp js-yaml.js demo/js/

uglify:
	if test ! `which uglifyjs` ; then npm install uglify-js ; fi
	uglifyjs js-yaml.js > js-yaml.min.js


gh-pages:
	@if test -z ${REMOTE_REPO} ; then \
		echo 'Remote repo URL not found' >&2 ; \
		exit 128 ; \
		fi
	mkdir ${TMP_DIR}
	cp -r demo/* ${TMP_DIR}
	touch ${TMP_DIR}/.nojekyll
	cd ${TMP_DIR} && \
		git init && \
		git add . && \
		git commit -q -m 'Recreated docs'
	cd ${TMP_DIR} && \
		git remote add remote ${REMOTE_REPO} && \
		git push --force remote +master:gh-pages 
	rm -rf ${TMP_DIR}

todo:
	grep 'TODO' -n -r ./lib 2>/dev/null || test true

.PHONY: test lint dev-deps gh-pages todo
.SILENT: todo test test-functional test-issues
