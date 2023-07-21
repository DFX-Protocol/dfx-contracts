import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, EmitOnlyThis } from "../helpers";
import { IBaseToken, IERC20Mock, IYieldTracker } from "../../typechain-types";
import DIContainer, { use } from "rsdi";
import ObjectResolver from "rsdi/dist/resolvers/ObjectResolver";
import { ClassOf } from "rsdi/dist/types";
import { IERC20AltApproveTests } from "../libraries/token/ERC20AltApprove.shared";
import { IERC20MetadataTests } from "../libraries/token/ERC20Metadata.shared";
import { IERC20Tests } from "../libraries/token/ERC20.shared";
import { GeneralTests } from "../helpers/shared/General.shared";

export class IERC20BaseTokenTests extends IERC20Tests
{
	protected override _deployFixture!: () => Promise<{ token: IBaseToken; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>;

	constructor(deployFixture: () => Promise<{ token: IBaseToken; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>)
	{
		super(deployFixture);

		// this.Context.addTest(this.TransferFrom_ShouldAllowTokenTransferAndNotReduceAllowanceIfHandler());
		// this.Context.addTest(this.TransferFrom_ShouldAllowTokenTransferMoreThanAllowanceAndNotReduceAllowanceIfHandler());
	}

	TransferFrom_ShouldAllowTokenTransferAndNotReduceAllowanceIfHandler(): Mocha.Test
	{
		return it("transferFrom: Should allow token transfer and not reduce allowance if handler", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, 50);
			await token.setHandler(bob.address, true);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(50));
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldAllowTokenTransferMoreThanAllowanceAndNotReduceAllowanceIfHandler(): Mocha.Test
	{
		return it("transferFrom: Should allow token transfer more than allowance and not reduce allowance if handler", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, 5);
			await token.setHandler(bob.address, true);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(5));
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}
}

export function testIERC20BaseToken(testClass: IERC20BaseTokenTests)
{
	context("IERC20 BaseToken", async () =>
	{
		testClass.TransferFrom_ShouldAllowTokenTransferAndNotReduceAllowanceIfHandler();
		testClass.TransferFrom_ShouldAllowTokenTransferMoreThanAllowanceAndNotReduceAllowanceIfHandler();
	});
}

async function deployBaseTokenFixture(): Promise<{ token: IBaseToken, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress, yieldTrackers: IYieldTracker[], dummyToken: IERC20Mock }>
{
	const signers = await ethers.getSigners();
	const alice = signers[0];
	const bob = signers[1];
	const carol = signers[2];


	const baseTokenFactory = await ethers.getContractFactory("BaseToken");
	const token = await baseTokenFactory.deploy("Base Token Name", "BTS", 1000);

	const yieldTrackerFactory = await ethers.getContractFactory("MockYieldTrackerEmitter");
	const yieldTracker1 = await yieldTrackerFactory.deploy();
	const yieldTracker2 = await yieldTrackerFactory.deploy();
	const yieldTrackers = [yieldTracker1, yieldTracker2];

	const dummyTokenFactory = await ethers.getContractFactory("ERC20Mock");
	const dummyToken = await dummyTokenFactory.deploy("Dummy Token", "DT");

	return { token, alice, bob, carol, yieldTrackers, dummyToken };
}

const container: DIContainer<{
	ERC20Tests: ObjectResolver<ClassOf<IERC20Tests>>,
	ERC20AltApproveTests: ObjectResolver<ClassOf<IERC20AltApproveTests>>,
	ERC20MetadataTests: ObjectResolver<ClassOf<IERC20MetadataTests>>
}> = new DIContainer();
container.add({
	ERC20Tests: new ObjectResolver(IERC20BaseTokenTests).construct(deployBaseTokenFixture),
	ERC20AltApproveTests: new ObjectResolver(IERC20AltApproveTests).construct(deployBaseTokenFixture),
	ERC20MetadataTests: new ObjectResolver(IERC20MetadataTests).construct(deployBaseTokenFixture, "Base Token Name", "BTS", 18)
});

describe("BaseToken", async () =>
{
	context("BaseToken", async () =>
	{
		it("constructor: Should set name of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = await token.name();
			// Assert
			expect(result).to.equal("Base Token Name");
		});

		it("constructor: Should set symbol of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = await token.symbol();
			// Assert
			expect(result).to.equal("BTS");
		});

		it("constructor: Should mint initial token supply", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployBaseTokenFixture);
			// Act
			const deployTransaction = token.deployTransaction;
			const balance = await token.balanceOf(alice.address);
			const totalSupply = await token.totalSupply();
			// Assert
			await EmitOnlyThis(deployTransaction, token, "Transfer(address,address,uint256)");
			await expect(deployTransaction).to.emit(token, "Transfer(address,address,uint256)").withArgs(ADDRESS_ZERO, alice.address, 1000);
			expect(balance).to.equal(1000);
			expect(totalSupply).to.equal(1000);
		});
	});

	container.get<GeneralTests<unknown>>("ERC20Tests").RunTests();
	container.get<GeneralTests<unknown>>("ERC20AltApproveTests").RunTests();
	container.get<GeneralTests<unknown>>("ERC20MetadataTests").RunTests();
});