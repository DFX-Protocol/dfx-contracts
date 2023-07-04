import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine, UINT256_MAX } from "../../helpers";
import { IERC20, IERC20AltApprove, IERC20Metadata, IERC20Mock } from "../../../typechain-types";

export class IERC20Tests
{
	protected _deployFixture: () => Promise<{ token: IERC20; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>;

	constructor(deployFixture: () => Promise<{ token: IERC20; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>)
	{
		this._deployFixture = deployFixture;
	}
	

	Approve_ShouldNotAllowSetOfApprovalFromZeroAddress(): Mocha.Test
	{
		return it("ERC20.approve: Should not allow set of approval from zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(this._deployFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			// Act
			const result = token.connect(signerZero).approve(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
		});
	}

	Approve_ShouldNotAllowSetOfApprovalToZeroAddress(): Mocha.Test
	{
		return it("ERC20.approve: Should not allow set of approval to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = token.approve(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
		});
	}

	Approve_ShouldEmitApprovalEvent(): Mocha.Test
	{
		return it("ERC20.approve: Should emit `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});
	}

	Approve_ShouldAllowSetOfApproval(): Mocha.Test
	{
		return it("ERC20.approve: Should allow set of approval", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			const approved = await token.allowance(alice.address, bob.address);
			expect(approved).to.equal(BigNumber.from(10));
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});
	}

	Approve_ProofOfUnfixableApproveAttackVector(): Mocha.Test
	{
		return it("ERC20.approve: Proof of unfixable approve/transferFrom attack vector", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);

			await token.approve(bob.address, 0);
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(50).sub(30);
			const expectedBalanceBob = (await token.balanceOf(bob.address)).add(50).add(30);
			// Act
			await token.approve(bob.address, 50);
			await StopAutomine();
			// What happens is that Alice is changing the approved tokens from 50 to 30.
			// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
			// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
			// if confirmed in the same block the transferFrom transaction is processed first.
			// We simulate that second case.
			await token.connect(bob).transferFrom(alice.address, bob.address, 50);
			await token.approve(bob.address, 30);
			await AdvanceBlock();
			// The Damange is now done. There is no way to prevent this inside the approve method.
			await StartAutomine();
			await token.connect(bob).transferFrom(alice.address, bob.address, 30);
			// Assert
			expect(await token.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
			expect(await token.balanceOf(bob.address)).to.equal(expectedBalanceBob);
		});
	}

	Transfer_ShouldEmitTransferEvent(): Mocha.Test
	{
		return it("ERC20.transfer: Should emit `Transfer` event", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.transfer(carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	Transfer_ShouldAllowTokenTransfer(): Mocha.Test
	{
		return it("ERC20.transfer: Should allow token transfer", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);

			const expectedTotalSupply = await token.totalSupply();
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = BigNumber.from(0).add(10);
			// Act
			const result = await token.transfer(carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	Transfer_ShouldNotAllowTransferFromZeroAddress(): Mocha.Test
	{
		return it("ERC20.transfer: Should not allow transfer from zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(this._deployFixture);

			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			// Act
			const result = token.connect(signerZero).transfer(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
		});
	}

	Transfer_ShouldNotAllowTransferToZeroAddress(): Mocha.Test
	{
		return it("ERC20.transfer: Should not allow transfer to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = token.transfer(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");

		});
	}

	Transfer_ShouldNotAllowTransferMoreThanBalance(): Mocha.Test
	{
		return it("ERC20.transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);

			const balanceAlice = (await token.balanceOf(alice.address));
			const balanceCarol = (await token.balanceOf(carol.address));
			const toTransfer = balanceAlice.add(10);
			// Act
			const result = token.transfer(carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, toTransfer);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			expect(aliceBal).to.equal(balanceAlice);
			expect(carolBal).to.equal(balanceCarol);
		});
	}

	TransferFrom_ShouldEmitTransferAndApprovalEvent(): Mocha.Test
	{
		return it("ERC20.transferFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			await token.approve(bob.address, 50);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldAllowTokenTransferAndReduceAllowance(): Mocha.Test
	{
		return it("ERC20.transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, 50);
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
			expect(allowance).to.equal(BigNumber.from(40));
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldAllowTokenTransferAndNotReduceInfiniteAllowance(): Mocha.Test
	{
		return it("ERC20.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const max: BigNumber = UINT256_MAX;
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, max);
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
			expect(allowance).to.equal(max);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldNotAllowTransferMoreThanBalance(): Mocha.Test
	{
		return it("ERC20.transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = await token.balanceOf(alice.address);
			const expectedBalanceCarol = await token.balanceOf(carol.address);
			const expectedAllowance = expectedBalanceAlice.add(200);
			await token.approve(bob.address, expectedAllowance);
			const toTransfer = expectedBalanceAlice.add(10);
			// Act
			const result = token.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "AmountExceedsBalance").withArgs(alice.address, expectedBalanceAlice, toTransfer);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(expectedAllowance);
		});
	}

	TransferFrom_ShouldNotAllowTransferMoreThanAllowance(): Mocha.Test
	{
		return it("ERC20.transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = await token.balanceOf(alice.address);
			const expectedBalanceCarol = await token.balanceOf(carol.address);
			await token.approve(bob.address, 90);
			// Act
			const result = token.connect(bob).transferFrom(alice.address, carol.address, 100);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InsufficientAllowance").withArgs(90, 100);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(90));
		});
	}
}

export class IERC20AltApproveTests
{
	protected _deployFixture: () => Promise<{ token: IERC20 & IERC20AltApprove; alice: SignerWithAddress; bob: SignerWithAddress; }>;

	constructor(deployFixture: () => Promise<{ token: IERC20 & IERC20AltApprove; alice: SignerWithAddress; bob: SignerWithAddress; }>)
	{
		this._deployFixture = deployFixture;
	}

	DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowance(): Mocha.Test
	{
		return it("ERC20.decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.decreaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.be.equal(expectedAllowance);
		});
	}

	DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes(): Mocha.Test
	{
		return it("ERC20.decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(20);
			// Act
			await token.decreaseAllowance(bob.address, 50);
			await token.decreaseAllowance(bob.address, 10);
			await token.decreaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	DecreaseAllowance_ShouldNotAllowTokenHolderToChangeAllowanceBelowZero(): Mocha.Test
	{
		return it("ERC20.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const allowance = await token.allowance(alice.address, bob.address);
			const expectedAllowance = BigNumber.from(100);
			// Act
			const result = token.decreaseAllowance(bob.address, allowance.add(1));
			// Assert
			await expect(result).to.revertedWithCustomError(token, "AllowanceBelowZero").withArgs(100, 101);
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowance(): Mocha.Test
	{
		return it("ERC20.increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.increaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceAboveHoldTokens(): Mocha.Test
	{
		return it("ERC20.increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			const balance = await token.balanceOf(alice.address);
			await token.approve(bob.address, balance);
			const expectedAllowance = BigNumber.from(200).add(balance);
			// Act
			const result = await token.increaseAllowance(bob.address, 200);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes(): Mocha.Test
	{
		return it("ERC20.increaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.approve(bob.address, 0);
			const expectedAllowance = BigNumber.from(80);
			// Act
			await token.increaseAllowance(bob.address, 50);
			await token.increaseAllowance(bob.address, 10);
			await token.increaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}
}

export class IERC20MetadataTests
{
	protected _deployFixture: () => Promise<{ token: IERC20Metadata; }>;
	protected _name: string;
	protected _symbol: string;
	protected _decimals: number;

	constructor(deployFixture: () => Promise<{ token: IERC20Metadata; }>, name: string, symbol: string, decimals: number)
	{
		this._deployFixture = deployFixture;
		this._name = name;
		this._symbol = symbol;
		this._decimals = decimals;
	}

	Decimals_ShouldReturnCorrectDecimals(): Mocha.Test
	{
		return it("ERC20.decimals: Should return correct decimals", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result: number = await token.decimals();
			// Assert
			expect(result).to.equal(this._decimals);
		});
	}

	Name_ShouldReturnCorrectName(): Mocha.Test
	{
		return it("ERC20.name: Should return correct name", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.name();
			// Assert
			expect(result).to.equal(this._name);
		});
	}

	Symbol_ShouldReturnCorrectSymbol(): Mocha.Test
	{
		return it("ERC20.symbol: Should return correct symbol", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.symbol();
			// Assert
			expect(result).to.equal(this._symbol);
		});
	}
}

export function testIERC20(testClass: IERC20Tests)
{
	context("IERC20", async () =>
	{
		testClass.Approve_ProofOfUnfixableApproveAttackVector();
		testClass.Approve_ShouldAllowSetOfApproval();
		testClass.Approve_ShouldEmitApprovalEvent();
		testClass.Approve_ShouldNotAllowSetOfApprovalFromZeroAddress();
		testClass.Approve_ShouldNotAllowSetOfApprovalToZeroAddress();
		testClass.TransferFrom_ShouldAllowTokenTransferAndNotReduceInfiniteAllowance();
		testClass.TransferFrom_ShouldAllowTokenTransferAndReduceAllowance();
		testClass.TransferFrom_ShouldEmitTransferAndApprovalEvent();
		testClass.TransferFrom_ShouldNotAllowTransferMoreThanAllowance();
		testClass.TransferFrom_ShouldNotAllowTransferMoreThanBalance();
		testClass.Transfer_ShouldAllowTokenTransfer();
		testClass.Transfer_ShouldEmitTransferEvent();
		testClass.Transfer_ShouldNotAllowTransferFromZeroAddress();
		testClass.Transfer_ShouldNotAllowTransferMoreThanBalance();
		testClass.Transfer_ShouldNotAllowTransferToZeroAddress();
	});
}

export function testIERC20AltApprove(testClass: IERC20AltApproveTests)
{
	context("IERC20AltApprove", async () =>
	{
		testClass.DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowance();
		testClass.DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes();
		testClass.DecreaseAllowance_ShouldNotAllowTokenHolderToChangeAllowanceBelowZero();
		testClass.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowance();
		testClass.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceAboveHoldTokens();
		testClass.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes();
	});
}

export function testIERC20Metadata(testClass: IERC20MetadataTests)
{
	context("IERC20Metadata", async () =>
	{
		testClass.Decimals_ShouldReturnCorrectDecimals();

		testClass.Name_ShouldReturnCorrectName();

		testClass.Symbol_ShouldReturnCorrectSymbol();
	});
}

describe("ERC20", async () =>
{
	async function deployERC20MockFixture(): Promise<{ token: IERC20Mock, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];
		const carol = signers[2];


		const erc20Factory = await ethers.getContractFactory("ERC20Mock");
		const token = await erc20Factory.deploy("Name", "SYM");

		await token.mockMint(alice.address, 100);

		return { token, alice, bob, carol };
	}

	context("ERC20", async () =>
	{
		it("ERC20.constructor: Should emit nothing", async () =>
		{
			// NOTICE: We use the original ERC20 to prevent testing an modified constructor.
			// Arrange
			const factory = await ethers.getContractFactory("ERC20");
			const originalERC20 = await factory.deploy("Original", "OOO");
			await originalERC20.deployed();
			// Act
			const result = originalERC20.deployTransaction;
			// Assert
			await EmitOnlyThis(result, originalERC20);
		});

		it("ERC20.constructor: Should set name of token", async () =>
		{
			// NOTICE: We use the original ERC20 to prevent testing an modified constructor.
			// Arrange
			const factory = await ethers.getContractFactory("ERC20");
			const originalERC20 = await factory.deploy("Original", "OOO");
			await originalERC20.deployed();
			// Act
			const result = await originalERC20.name();
			// Assert
			expect(result).to.equal("Original");
		});

		it("ERC20.constructor: Should set symbol of token", async () =>
		{
			// NOTICE: We use the original ERC20 to prevent testing an modified constructor.
			// Arrange
			const factory = await ethers.getContractFactory("ERC20");
			const originalERC20 = await factory.deploy("Original", "OOO");
			await originalERC20.deployed();
			// Act
			const result = await originalERC20.symbol();
			// Assert
			expect(result).to.equal("OOO");
		});

		it("ERC20._mint: Should mint token", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			const balanceAlice = await token.balanceOf(alice.address);
			const totalSupply = await token.totalSupply();
			const expectedBalanceAlice = balanceAlice.add(100);
			const expectedTotalSupply = totalSupply.add(100);
			// Act
			await token.mockMint(alice.address, 100);
			// Assert
			expect(await token.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
			expect(await token.totalSupply()).to.equal(expectedTotalSupply);
		});

		it("ERC20._mint: Should not mint token to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = token.mockMint(ADDRESS_ZERO, 100);
			// Assert
			await expect(result).to.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not mint to zero address.");
		});

		it("ERC20._burn: Should burn token", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			const balanceAlice = await token.balanceOf(alice.address);
			const totalSupply = await token.totalSupply();
			const expectedBalanceAlice = balanceAlice.sub(50);
			const expectedTotalSupply = totalSupply.sub(50);
			// Act
			await token.mockBurn(alice.address, 50);
			// Assert
			expect(await token.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
			expect(await token.totalSupply()).to.equal(expectedTotalSupply);
		});

		it("ERC20._burn: Should not burn more token than owned", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			const balanceAlice = await token.balanceOf(alice.address);
			const burnAmount = balanceAlice.add(1);
			// Act
			const result = token.mockBurn(alice.address, burnAmount);
			// Assert
			await expect(result).to.revertedWithCustomError(token, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, burnAmount);
		});

		it("ERC20._burn: Should not burn token from zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = token.mockBurn(ADDRESS_ZERO, 50);
			// Assert
			await expect(result).to.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not burn from zero address.");
		});
	});

	testIERC20(new IERC20Tests(deployERC20MockFixture));

	testIERC20AltApprove(new IERC20AltApproveTests(deployERC20MockFixture));

	testIERC20Metadata(new IERC20MetadataTests(deployERC20MockFixture, "Name", "SYM", 18));
});