export abstract class GeneralTests<T>
{
	protected _deployFixture: () => T;
	protected abstract Context: Mocha.Suite;
	// protected abstract Context: Mocha.Suite;

	constructor(deployFixture: () => T)
	{
		this._deployFixture = deployFixture;
	}

	// Recusrive Test context mapping not working, damn typescript....
	Initialize(...inheritedTests: GeneralTests<unknown>[])
	{
		inheritedTests.forEach(tests => this.Context.addSuite(tests.RunTests()));
	}

	RunTests(): Mocha.Suite
	{
		return this.Context;
	}
}
