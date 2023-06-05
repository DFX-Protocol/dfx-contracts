module.exports = {
	skipFiles: ["mocks", "compare"],
	mocha: {
		grep: /(@skip-on-coverage|@compare)/, // Find everything with this tag
		invert: true               // Run the grep's inverse set.
	}
}