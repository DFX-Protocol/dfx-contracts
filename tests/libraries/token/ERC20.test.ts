import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_ZERO, EmitOnlyThis } from "../../helpers";
import { GeneralTests } from "../../helpers/shared/General.shared";
import DIContainer, { use } from "rsdi";
import { IERC20Tests } from "./ERC20.shared";
import { IERC20AltApproveTests } from "./ERC20AltApprove.shared";
import { IERC20MetadataTests } from "./ERC20Metadata.shared";
import ObjectResolver from "rsdi/dist/resolvers/ObjectResolver";
import { ClassOf } from "rsdi/dist/types";
import { IERC20Mock } from "../../../typechain-types";

const container: DIContainer<{
	ERC20Tests: ObjectResolver<ClassOf<IERC20Tests>>,
	ERC20AltApproveTests: ObjectResolver<ClassOf<IERC20AltApproveTests>>;
	ERC20MetadataTests: ObjectResolver<ClassOf<IERC20MetadataTests>>;
}> = new DIContainer();

async function deployERC20MockFixture(): Promise<{ token: IERC20Mock; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>
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

container.add({
	ERC20Tests: new ObjectResolver(IERC20Tests).construct(deployERC20MockFixture),
	ERC20AltApproveTests: new ObjectResolver(IERC20AltApproveTests).construct(deployERC20MockFixture),
	ERC20MetadataTests: new ObjectResolver(IERC20MetadataTests).construct(deployERC20MockFixture, "Name", "SYM", 18, use("ERC20Tests"))
});

describe("ERC20", async () =>
{
	context("ERC20", async () =>
	{
		it("constructor: Should emit nothing", async () =>
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

		it("constructor: Should set name of token", async () =>
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

		it("constructor: Should set symbol of token", async () =>
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

		it("_mint: Should mint token", async () =>
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

		it("_mint: Should not mint token to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = token.mockMint(ADDRESS_ZERO, 100);
			// Assert
			await expect(result).to.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not mint to zero address.");
		});

		it("_burn: Should burn token", async () =>
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

		it("_burn: Should not burn more token than owned", async () =>
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

		it("_burn: Should not burn token from zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = token.mockBurn(ADDRESS_ZERO, 50);
			// Assert
			await expect(result).to.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not burn from zero address.");
		});
	});

	// container.get<GeneralTests<unknown>>("ERC20Tests").RunTests();

	container.get<GeneralTests<unknown>>("ERC20AltApproveTests").RunTests();

	container.get<GeneralTests<unknown>>("ERC20MetadataTests").RunTests();
});