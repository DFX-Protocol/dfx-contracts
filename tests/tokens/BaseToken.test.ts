import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, EmitOnlyThis } from "../helpers";
import { IBaseToken, IYieldTracker } from "../../typechain-types";
import { IERC20Tests, IERC20AltApproveTests, IERC20MetadataTests, testIERC20, testIERC20AltApprove, testIERC20Metadata } from "../libraries/token/ERC20.test";

describe("BaseToken", async () =>
{
	async function deployBaseTokenFixture(): Promise<{ token: IBaseToken, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress, yieldTrackers: IYieldTracker[] }>
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
		const yieldTrackers = [ yieldTracker1, yieldTracker2 ];

		return { token, alice, bob, carol, yieldTrackers };
	}

	context("BaseToken", async () =>
	{
		it("BaseToken.constructor: Should set name of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = await token.name();
			// Assert
			expect(result).to.equal("Base Token Name");
		});

		it("BaseToken.constructor: Should set symbol of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = await token.symbol();
			// Assert
			expect(result).to.equal("BTS");
		});

		it("BaseToken.constructor: Should mint initial token supply", async () =>
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

	context("IBaseToken", async () =>
	{
		it("BaseToken.setInfo: Should allow govenor to change name and symbol of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Alice is govenor
			await token.setInfo("New Base Token Name", "NBTS");
			// Assert
			expect(await token.name()).to.equal("New Base Token Name");
			expect(await token.symbol()).to.equal("NBTS");
		});

		it("BaseToken.setInfo: Should not allow non govenor to change name and symbol of token", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Bob is not a govenor
			const result =  token.connect(bob).setInfo("New Base Token Name", "NBTS");
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});

		it("BaseToken.setYieldTrackers: Should allow govenor to set yield trackers", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Alice is govenor
			await token.setYieldTrackers([bob.address, carol.address]);
			// Assert
			expect(await token.yieldTrackers(0)).to.equal(bob.address);
			expect(await token.yieldTrackers(1)).to.equal(carol.address);
		});

		it("BaseToken.setYieldTrackers: Should not allow non govenor to set yield trackers", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setYieldTrackers([bob.address, carol.address]);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});

		it("BaseToken.addAdmin: Should allow govenor to add admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Alice is govenor
			await token.addAdmin(bob.address);
			// Assert
			expect(await token.admins(bob.address)).to.be.true;
		});

		it("BaseToken.addAdmin: Should not allow non govenor to add admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).addAdmin(bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
			expect(await token.admins(bob.address)).to.be.false;
		});

		it("BaseToken.addNonStakingAccount: Should allow admin to add non staking account with no yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			// Act
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.true;
			expect(await token.nonStakingSupply()).to.equal(100);
		});

		it("BaseToken.addNonStakingAccount: Should allow admin to add non staking account with yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol, yieldTrackers } = await loadFixture(deployBaseTokenFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.true;
			expect(await token.nonStakingSupply()).to.equal(100);
			await expect(result).to.emit(yieldTrackers[0], "UpdateRewards(address)").withArgs(carol.address);
			await expect(result).to.emit(yieldTrackers[1], "UpdateRewards(address)").withArgs(carol.address);
		});

		it("BaseToken.addNonStakingAccount: Should not allow non admin to add non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyAdmin");
		});

		it("BaseToken.addNonStakingAccount: Should not allow to add already added non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			const result = token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountAlreadyMarked").withArgs(carol.address);
		});

		it("BaseToken.removeAdmin: Should allow govenor to remove admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(bob.address);
			// Act
			// Alice is govenor
			await token.removeAdmin(bob.address);
			// Assert
			expect(await token.admins(bob.address)).to.be.false;
		});

		it("BaseToken.removeAdmin: Should not allow non govenor to remove admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(bob.address);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).removeAdmin(bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
			expect(await token.admins(bob.address)).to.be.true;
		});

		it("BaseToken.removeNonStakingAccount: Should allow admin to remove non staking account with no yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			await token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.false;
			expect(await token.nonStakingSupply()).to.equal(0);
		});

		it("BaseToken.removeNonStakingAccount: Should allow admin to remove non staking account with yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol, yieldTrackers } = await loadFixture(deployBaseTokenFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.false;
			expect(await token.nonStakingSupply()).to.equal(0);
			await expect(result).to.emit(yieldTrackers[0], "UpdateRewards(address)").withArgs(carol.address);
			await expect(result).to.emit(yieldTrackers[1], "UpdateRewards(address)").withArgs(carol.address);
		});

		it("BaseToken.removeNonStakingAccount: Should not allow non admin to remove non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			// Act
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyAdmin");
		});

		it("BaseToken.removeNonStakingAccount: Should not allow to remove unmarked non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(bob.address);
			// Act
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountNotMarked").withArgs(carol.address);
		});

		it("BaseToken.removeNonStakingAccount: Should not allow to remove marked non staking account twice", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			await token.connect(bob).removeNonStakingAccount(carol.address);
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountNotMarked").withArgs(carol.address);
		});

		it("BaseToken.setHandler: Should allow govenor to set handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Alice is govenor
			await token.setHandler(bob.address, true);
			// Assert
			expect(await token.isHandler(bob.address)).to.be.true;
		});

		it("BaseToken.setHandler: Should not allow non govenor to set handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setHandler(bob.address, true);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});

		it("BaseToken.setHandler: Should allow govenor to unset handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			await token.setHandler(bob.address, true);
			// Act
			// Alice is govenor
			await token.setHandler(bob.address, false);
			// Assert
			expect(await token.isHandler(bob.address)).to.be.false;
		});

		it("BaseToken.setInPrivateTransferMode: Should allow govenor to set private transfer mode", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Alice is govenor
			await token.setInPrivateTransferMode(true);
			// Assert
			expect(await token.inPrivateTransferMode()).to.be.true;
		});

		it("BaseToken.setInPrivateTransferMode: Should not allow non govenor to set private transfer mode", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(deployBaseTokenFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setInPrivateTransferMode(true);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});

		it("BaseToken.setInPrivateTransferMode: Should allow govenor to unset private transfer mode", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployBaseTokenFixture);
			await token.setInPrivateTransferMode(true);
			// Act
			// Alice is govenor
			await token.setInPrivateTransferMode(false);
			// Assert
			expect(await token.inPrivateTransferMode()).to.be.false;
		});

		it("BaseToken.claim: Should call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, yieldTrackers } = await loadFixture(deployBaseTokenFixture);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.claim(bob.address);
			// Assert
			await expect(result).to.emit(yieldTrackers[0], "Claim(address,address)").withArgs(alice.address, bob.address);
			await expect(result).to.emit(yieldTrackers[1], "Claim(address,address)").withArgs(alice.address, bob.address);
		});

		it("BaseToken.recoverClaim: Should allow admin to call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, carol, yieldTrackers } = await loadFixture(deployBaseTokenFixture);
			await token.addAdmin(alice.address);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.recoverClaim(carol.address, bob.address);
			// Assert
			await expect(result).to.emit(yieldTrackers[0], "Claim(address,address)").withArgs(carol.address, bob.address);
			await expect(result).to.emit(yieldTrackers[1], "Claim(address,address)").withArgs(carol.address, bob.address);
		});

		it("BaseToken.recoverClaim: Should not allow non admin to call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, carol, yieldTrackers } = await loadFixture(deployBaseTokenFixture);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = token.recoverClaim(carol.address, bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(alice.address, "onlyAdmin");
		});
	});

	testIERC20(new IERC20Tests(deployBaseTokenFixture));

	testIERC20AltApprove(new IERC20AltApproveTests(deployBaseTokenFixture));

	testIERC20Metadata(new IERC20MetadataTests(deployBaseTokenFixture, "Base Token Name", "BTS", 18));
});