test: test_functional test_issues

test_issues:
	@echo 
	@echo "## ISSUES ######################################################################"
	@echo "################################################################################"
	@echo 
	@node ./test/issues/run.js
	@echo 

test_functional:
	@echo 
	@echo "## FUNCTIONAL ##################################################################"
	@echo "################################################################################"
	@echo 
	@node ./test/functional/run.js
	@echo 
