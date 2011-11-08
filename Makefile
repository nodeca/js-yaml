PATH := ./node_modules/.bin:${PATH}


.SILENT: test test-functional test-issues


test: test-functional test-issues

test-issues:
	echo 
	echo "## ISSUES ######################################################################"
	echo "################################################################################"
	echo 
	node ./test/issues/run.js
	echo 

test-functional:
	echo 
	echo "## FUNCTIONAL ##################################################################"
	echo "################################################################################"
	echo 
	node ./test/functional/run.js
	echo 


build: browserify uglify

browserify:
	if test ! `which browserify` ; then npm install browserify ; fi
	browserify index.js -o js-yaml.js

uglify:
	if test ! `which uglifyjs` ; then npm install uglify-js ; fi
	uglifyjs js-yaml.js > js-yaml.min.js

gh-pages: build
	git checkout -b gh-pages
	git commit -am
	git push origin gh-pages
	git checkout master
