PATH := ./node_modules/.bin:${PATH}


.SILENT: test test_functional test_issues


test: test_functional test_issues

test_issues:
	echo 
	echo "## ISSUES ######################################################################"
	echo "################################################################################"
	echo 
	node ./test/issues/run.js
	echo 

test_functional:
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
