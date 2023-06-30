import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine, UINT256_MAX } from "../helpers";
import { BigNumber } from "ethers";
import { IBaseToken, IYieldTracker } from "../../typechain-types";
import { IERC20MetadataTests, testIERC20Metadata } from "../libraries/token/IERC20Metadata.shared";

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

	context("IBaseToken", async () =>
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

	testIERC20Metadata(new IERC20MetadataTests(deployBaseTokenFixture, "Base Token Name", "BTS", 18));
	// context("IERC20", async () =>
	// {
	// 	it("BaseToken.approve: Should not allow set of approval from zero address", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice } = await loadFixture(deployBaseTokenFixture);
	// 		const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO);
	// 		// Fund the zero address to pay for the transaction
	// 		await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
	// 		// Act
	// 		const result = token.connect(signerZero).approve(alice.address, 10);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
	// 	});

	// 	it("BaseToken.approve: Should not allow set of approval to zero address", async () =>
	// 	{
	// 		// Arrange
	// 		const { token } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = token.approve(ADDRESS_ZERO, 10);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
	// 	});

	// 	it("BaseToken.approve: Should emit `Approval` event", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.approve(bob.address, 10);
	// 		// Assert
	// 		await expect(result).to.emit(baseToken, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)");
	// 	});

	// 	it("BaseToken.approve: Should allow set of approval", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.approve(bob.address, 10);
	// 		// Assert
	// 		const approved = await token.allowance(alice.address, bob.address);
	// 		expect(approved).to.equal(BigNumber.from(10));
	// 		await expect(result).to.emit(baseToken, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)");
	// 	});

	// 	it("BaseToken.approve: Proof of unfixable approve/transferFrom attack vector", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.approve(bob.address, 0);
	// 		const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(50).sub(30);
	// 		const expectedBalanceBob = (await token.balanceOf(bob.address)).add(50).add(30);
	// 		// Act
	// 		await token.approve(bob.address, 50);
	// 		await StopAutomine();
	// 		// What happens is that Alice is changing the approved tokens from 50 to 30.
	// 		// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
	// 		// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
	// 		// if confirmed in the same block the transferFrom transaction is processed first.
	// 		// We simulate that second case.
	// 		await token.connect(bob).transferFrom(alice.address, bob.address, 50);
	// 		await token.approve(bob.address, 30);
	// 		await AdvanceBlock();
	// 		// The Damange is now done. There is no way to prevent this inside the approve method.
	// 		await StartAutomine();
	// 		await token.connect(bob).transferFrom(alice.address, bob.address, 30);
	// 		// Assert
	// 		expect(await token.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
	// 		expect(await token.balanceOf(bob.address)).to.equal(expectedBalanceBob);
	// 	});

	// 	it("BaseToken.transfer: Should emit `Transfer` event", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, carol } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.transfer(carol.address, 10);
	// 		// Assert
	// 		await expect(result).to.emit(baseToken, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Transfer(address,address,uint256)");
	// 	});

	// 	it("BaseToken.transfer: Should allow token transfer", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const expectedBalanceAlice = BigNumber.from(1000).sub(10);
	// 		const expectedBalanceCarol = BigNumber.from(0).add(10);
	// 		const expectedTotalSupply = BigNumber.from(1000);
	// 		// Act
	// 		const result = await token.transfer(carol.address, 10);
	// 		// Assert
	// 		const totalSupply = await token.totalSupply();
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		expect(totalSupply).to.equal(expectedTotalSupply);
	// 		expect(aliceBal).to.equal(expectedBalanceAlice);
	// 		expect(carolBal).to.equal(expectedBalanceCarol);
	// 		await EmitOnlyThis(result, baseToken, "Transfer(address,address,uint256)");
	// 	});

	// 	it("BaseToken.transfer: Should not allow transfer from zero address", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice } = await loadFixture(deployBaseTokenFixture);
	// 		const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO);
	// 		// Fund the zero address to pay for the transaction
	// 		await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
	// 		// Act
	// 		const result = token.connect(signerZero).transfer(alice.address, 10);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
	// 	});

	// 	it("BaseToken.transfer: Should not allow transfer to zero address", async () =>
	// 	{
	// 		// Arrange
	// 		const { token } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = token.transfer(ADDRESS_ZERO, 10);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");

	// 	});

	// 	it("BaseToken.transfer: Should not allow transfer more than balance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const balanceAlice = (await token.balanceOf(alice.address));
	// 		const balanceCarol = (await token.balanceOf(carol.address));
	// 		const toTransfer = balanceAlice.add(10);
	// 		// Act
	// 		const result = token.transfer(carol.address, toTransfer);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, toTransfer);
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		expect(aliceBal).to.equal(balanceAlice);
	// 		expect(carolBal).to.equal(balanceCarol);
	// 	});

	// 	it("BaseToken.transferFrom: Should emit `Transfer` and `Approval` event", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob, carol } = await loadFixture(deployBaseTokenFixture);
	// 		await token.approve(bob.address, 50);
	// 		// Act
	// 		const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
	// 		// Assert
	// 		await expect(result).to.emit(baseToken, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
	// 		await expect(result).to.emit(baseToken, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
	// 	});

	// 	it("BaseToken.transferFrom: Should allow token transfer and reduce allowance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
	// 		const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
	// 		const expectedTotalSupply = (await token.totalSupply());
	// 		await token.approve(bob.address, 50);
	// 		// Act
	// 		const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
	// 		// Assert
	// 		const totalSupply = await token.totalSupply();
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		const allowance = await token.allowance(alice.address, bob.address);
	// 		expect(totalSupply).to.equal(expectedTotalSupply);
	// 		expect(aliceBal).to.equal(expectedBalanceAlice);
	// 		expect(carolBal).to.equal(expectedBalanceCarol);
	// 		expect(allowance).to.equal(BigNumber.from(40));
	// 		await expect(result).to.emit(baseToken, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
	// 		await expect(result).to.emit(baseToken, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
	// 	});

	// 	it("BaseToken.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const max: BigNumber = UINT256_MAX;
	// 		const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
	// 		const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
	// 		const expectedTotalSupply = (await token.totalSupply());
	// 		await token.approve(bob.address, max);
	// 		// Act
	// 		const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
	// 		// Assert
	// 		const totalSupply = await token.totalSupply();
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		const allowance = await token.allowance(alice.address, bob.address);
	// 		expect(totalSupply).to.equal(expectedTotalSupply);
	// 		expect(aliceBal).to.equal(expectedBalanceAlice);
	// 		expect(carolBal).to.equal(expectedBalanceCarol);
	// 		expect(allowance).to.equal(max);
	// 		await expect(result).to.emit(baseToken, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
	// 		await EmitOnlyThis(result, baseToken, "Transfer(address,address,uint256)");
	// 	});

	// 	it("BaseToken.transferFrom: Should not allow transfer more than balance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const expectedBalanceAlice = await token.balanceOf(alice.address);
	// 		const expectedBalanceCarol = await token.balanceOf(carol.address);
	// 		const expectedAllowance = expectedBalanceAlice.add(200);
	// 		await token.approve(bob.address, expectedAllowance);
	// 		const toTransfer = expectedBalanceAlice.add(10);
	// 		// Act
	// 		const result = token.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "AmountExceedsBalance").withArgs(alice.address, expectedBalanceAlice, toTransfer);
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		const allowance = await token.allowance(alice.address, bob.address);
	// 		expect(aliceBal).to.equal(expectedBalanceAlice);
	// 		expect(carolBal).to.equal(expectedBalanceCarol);
	// 		expect(allowance).to.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.transferFrom: Should not allow transfer more than allowance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob, carol } = await loadFixture(deployBaseTokenFixture);
	// 		const expectedBalanceAlice = await token.balanceOf(alice.address);
	// 		const expectedBalanceCarol = await token.balanceOf(carol.address);
	// 		await token.approve(bob.address, 90);
	// 		// Act
	// 		const result = token.connect(bob).transferFrom(alice.address, carol.address, 100);
	// 		// Assert
	// 		await expect(result).to.be.revertedWithCustomError(baseToken, "InsufficientAllowance").withArgs(90, 100);
	// 		const aliceBal = await token.balanceOf(alice.address);
	// 		const carolBal = await token.balanceOf(carol.address);
	// 		const allowance = await token.allowance(alice.address, bob.address);
	// 		expect(aliceBal).to.equal(expectedBalanceAlice);
	// 		expect(carolBal).to.equal(expectedBalanceCarol);
	// 		expect(allowance).to.equal(BigNumber.from(90));
	// 	});
	// });

	// describe("IERC20AltApprove", () =>
	// {
	// 	it("BaseToken.decreaseAllowance: Should allow token holder to change allowance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.increaseAllowance(bob.address, 100);
	// 		const expectedAllowance = BigNumber.from(50);
	// 		// Act
	// 		const result = await token.decreaseAllowance(bob.address, 50);
	// 		// Assert
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)");
	// 		expect(await token.allowance(alice.address, bob.address)).to.be.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.increaseAllowance(bob.address, 100);
	// 		const expectedAllowance = BigNumber.from(20);
	// 		// Act
	// 		await token.decreaseAllowance(bob.address, 50);
	// 		await token.decreaseAllowance(bob.address, 10);
	// 		await token.decreaseAllowance(bob.address, 20);
	// 		// Assert
	// 		expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.increaseAllowance(bob.address, 100);
	// 		const allowance = await token.allowance(alice.address, bob.address);
	// 		const expectedAllowance = BigNumber.from(100);
	// 		// Act
	// 		const result = token.decreaseAllowance(bob.address, allowance.add(1));
	// 		// Assert
	// 		await expect(result).to.revertedWithCustomError(baseToken, "AllowanceBelowZero").withArgs(100, 101);
	// 		expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.increaseAllowance: Should allow token holder to change allowance", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		const expectedAllowance = BigNumber.from(50);
	// 		// Act
	// 		const result = await token.increaseAllowance(bob.address, 50);
	// 		// Assert
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)");
	// 		expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.approve(bob.address, 0);
	// 		const expectedAllowance = BigNumber.from(200);
	// 		// Act
	// 		const result = await token.increaseAllowance(bob.address, expectedAllowance);
	// 		// Assert
	// 		await EmitOnlyThis(result, baseToken, "Approval(address,address,uint256)");
	// 		expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
	// 	});

	// 	it("BaseToken.increaseAllowance: Should allow token holder to change allowance multible times", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice, bob } = await loadFixture(deployBaseTokenFixture);
	// 		await token.approve(bob.address, 0);
	// 		const expectedAllowance = BigNumber.from(80);
	// 		// Act
	// 		await token.increaseAllowance(bob.address, 50);
	// 		await token.increaseAllowance(bob.address, 10);
	// 		await token.increaseAllowance(bob.address, 20);
	// 		// Assert
	// 		expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
	// 	});
	// });

	// describe("IERC20Metadata", async () =>
	// {
	// 	it("BaseToken.decimals: Should return correct decimals", async () =>
	// 	{
	// 		// Arrange
	// 		const { token } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const decimals: number = await token.decimals();
	// 		// Assert
	// 		expect(decimals).to.equal(18);
	// 	});

	// 	it("BaseToken.name: Should return correct name", async () =>
	// 	{
	// 		// Arrange
	// 		const { token } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.name();
	// 		// Assert
	// 		expect(result).to.equal("Base Token Name");
	// 	});

	// 	it("BaseToken.symbol: Should return correct symbol", async () =>
	// 	{
	// 		// Arrange
	// 		const { token } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.symbol();
	// 		// Assert
	// 		expect(result).to.equal("BTS");
	// 	});
	// });

	// context("IGovernable", async () =>
	// {
	// 	it("BaseToken.constructor: Should set govenor of token", async () =>
	// 	{
	// 		// Arrange
	// 		const { token, alice } = await loadFixture(deployBaseTokenFixture);
	// 		// Act
	// 		const result = await token.gov();
	// 		// Assert
	// 		expect(result).to.equal(alice.address);
	// 	});
	// });
});