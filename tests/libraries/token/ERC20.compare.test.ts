import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, EmitOnlyThis, FormatTableColumn, FormatTableTitle, UINT256_MAX } from "../../helpers";
import { BigNumber } from "ethers";
import { ERC20Mock_Original, IERC20Mock } from "../../../typechain-types";

describe("ERC20 Compare @compare", async () =>
{
	async function deployERC20MockFixture(): Promise<{ erc20: IERC20Mock, erc20o: ERC20Mock_Original, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];
		const carol = signers[2];

		const erc20Factory = await ethers.getContractFactory("ERC20Mock");
		const erc20 = await erc20Factory.deploy("Name", "SYM");
		const erc20oFactory = await ethers.getContractFactory("ERC20Mock_Original");
		const erc20o = await erc20oFactory.deploy("Name", "SYM");

		return { erc20, erc20o, alice, bob, carol };
	}

	context("Ensure same behavior", async () =>
	{
		it("ERC20.approve: Should not allow set of approval from zero address", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice } = await loadFixture(deployERC20MockFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			// Act
			const result = erc20.connect(signerZero).approve(alice.address, 10);
			const resultOriginal = erc20o.connect(signerZero).approve(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
			await expect(resultOriginal).to.be.revertedWith("ERC20: approve from the zero address");
		});

		it("ERC20.approve: Should not allow set of approval to zero address", async () =>
		{
			// Arrange
			const { erc20, erc20o } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = erc20.approve(ADDRESS_ZERO, 10);
			const resultOriginal = erc20o.approve(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
			await expect(resultOriginal).to.be.revertedWith("ERC20: approve to the zero address");
		});

		it("ERC20.approve: Should allow set of approval", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.approve(bob.address, 10);
			const resultOriginal = await erc20o.approve(bob.address, 10);
			// Assert
			const approved = await erc20.allowance(alice.address, bob.address);
			const approvedOriginal = await erc20o.allowance(alice.address, bob.address);
			expect(approved).to.equal(approvedOriginal);
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
			await expect(resultOriginal).to.emit(erc20o, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(resultOriginal, erc20o, "Approval(address,address,uint256)");
		});

		it("ERC20.transfer: Should allow token transfer", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			// Act
			const result = await erc20.transfer(carol.address, 10);
			const resultOriginal = await erc20o.transfer(carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const totalSupplyOriginal = await erc20o.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			expect(totalSupply).to.equal(totalSupplyOriginal);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Transfer(address,address,uint256)");
			await expect(resultOriginal).to.emit(erc20o, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(resultOriginal, erc20o, "Transfer(address,address,uint256)");
		});

		it("ERC20.transfer: Should not allow transfer from zero address", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice } = await loadFixture(deployERC20MockFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			// Act
			const result = erc20.connect(signerZero).transfer(alice.address, 10);
			const resultOriginal = erc20o.connect(signerZero).transfer(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
			await expect(resultOriginal).to.be.revertedWith("ERC20: transfer from the zero address");
		});

		it("ERC20.transfer: Should not allow transfer to zero address", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			// Act
			const result = erc20.transfer(ADDRESS_ZERO, 10);
			const resultOriginal = erc20o.transfer(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");
			await expect(resultOriginal).to.be.revertedWith("ERC20: transfer to the zero address");
		});

		it("ERC20.transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			const balanceAlice = (await erc20.balanceOf(alice.address));
			const toTransfer = balanceAlice.add(10);
			// Act
			const result = erc20.transfer(carol.address, toTransfer);
			const resultOriginal = erc20o.transfer(carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, toTransfer);
			await expect(resultOriginal).to.be.revertedWith("ERC20: transfer amount exceeds balance");
			const aliceBal = await erc20.balanceOf(alice.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
		});

		it("ERC20.transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, 50);
			await erc20o.approve(bob.address, 50);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			const resultOriginal = await erc20o.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const totalSupplyOriginal = await erc20o.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			const allowanceOriginal = await erc20o.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(totalSupplyOriginal);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
			expect(allowance).to.equal(allowanceOriginal);
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
			await expect(resultOriginal).to.emit(erc20o, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(resultOriginal).to.emit(erc20o, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(resultOriginal, erc20o, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, UINT256_MAX);
			await erc20o.approve(bob.address, UINT256_MAX);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			const resultOriginal = await erc20o.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const totalSupplyOriginal = await erc20o.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			const allowanceOriginal = await erc20o.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(totalSupplyOriginal);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
			expect(allowance).to.not.equal(allowanceOriginal); // Old implementation reduces allowance
			// await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Transfer(address,address,uint256)");
			await expect(resultOriginal).to.emit(erc20o, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, UINT256_MAX.sub(10));
			await expect(resultOriginal).to.emit(erc20o, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(resultOriginal, erc20o, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			const toTransfer = BigNumber.from(110);
			const toApprove = BigNumber.from(200);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, toApprove);
			await erc20o.approve(bob.address, toApprove);
			// Act
			const result = erc20.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			const resultOriginal = erc20o.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "AmountExceedsBalance").withArgs(alice.address, 100, toTransfer);
			await expect(resultOriginal).to.be.revertedWith("ERC20: transfer amount exceeds balance");
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			const allowanceOriginal = await erc20o.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
			expect(allowance).to.equal(allowanceOriginal);
		});

		it("ERC20.transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			const toTransfer = BigNumber.from(100);
			const toApprove = BigNumber.from(90);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, toApprove);
			await erc20o.approve(bob.address, toApprove);
			// Act
			const result = erc20.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			const resultOriginal = erc20o.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InsufficientAllowance").withArgs(90, 100);
			await expect(resultOriginal).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			const aliceBalOriginal = await erc20o.balanceOf(alice.address);
			const carolBalOriginal = await erc20o.balanceOf(carol.address);
			const allowanceOriginal = await erc20o.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(aliceBalOriginal);
			expect(carolBal).to.equal(carolBalOriginal);
			expect(allowance).to.equal(allowanceOriginal);
		});

		it("ERC20.decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			await erc20o.increaseAllowance(bob.address, 100);
			// Act
			await erc20.decreaseAllowance(bob.address, 50);
			await erc20o.decreaseAllowance(bob.address, 50);
			// Assert
			expect(await erc20.allowance(alice.address, bob.address)).to.be.equal(await erc20o.allowance(alice.address, bob.address));
		});

		it("ERC20.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			await erc20o.increaseAllowance(bob.address, 100);
			// Act
			const result = erc20.decreaseAllowance(bob.address, 101);
			const resultOriginal = erc20o.decreaseAllowance(bob.address, 101);
			// Assert
			await expect(result).to.revertedWithCustomError(erc20, "AllowanceBelowZero").withArgs(100, 101);
			await expect(resultOriginal).to.revertedWith("ERC20: decreased allowance below zero");
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(await erc20o.allowance(alice.address, bob.address));
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			await erc20.increaseAllowance(bob.address, 50);
			await erc20o.increaseAllowance(bob.address, 50);
			// Assert
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(await erc20o.allowance(alice.address, bob.address));
		});

		it("ERC20.name: Should return correct name", async () =>
		{
			// Arrange
			const { erc20, erc20o } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.name();
			const resultOriginal = await erc20o.name();
			// Assert
			expect(result).to.equal(resultOriginal);
		});

		it("ERC20.symbol: Should return correct symbol", async () =>
		{
			// Arrange
			const { erc20, erc20o } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.symbol();
			const resultOriginal = await erc20o.symbol();
			// Assert
			expect(result).to.equal(resultOriginal);
		});
	});

	context("Gas", async () =>
	{
		const AllowedCreationGasDiffPercent = 15;
		const AllowedTransactionGasDiffPercent = 1;
		const GasTable: Array<{ description: string, newGasUsed: BigNumber, oldGasUsed: BigNumber, warnLevel?: number }> = [];

		after(async () =>
		{
			const formatedTitle = FormatTableTitle(102, "Gas statistics for ERC20", "center");
			const formatedDesc = FormatTableTitle(60, "Description");
			const formatedNewGas = FormatTableTitle(18, "New gas used", "right");
			const formatedOldGas = FormatTableTitle(18, "Old gas used", "right");

			console.log("+--------------------------------------------------------------------------------------------------------+"); // 102
			console.log("| %s |", formatedTitle);
			console.log("+--------------------------------------------------------------+--------------------+--------------------+"); // 60/18/18
			console.log("| %s | %s | %s |", formatedDesc, formatedNewGas, formatedOldGas);
			console.log("+--------------------------------------------------------------+--------------------+--------------------+");
			GasTable.forEach(line =>
			{
				const describe = FormatTableColumn(60, line.description);
				const newGas = FormatTableColumn(18, line.newGasUsed.toString(), "right", line.warnLevel);
				const oldGas = FormatTableColumn(18, line.oldGasUsed.toString(), "right");
				console.log("| %s | %s | %s |", describe, newGas, oldGas);
			});
			console.log("+--------------------------------------------------------------+--------------------+--------------------+");
		});

		it("Contract creation should be cheaper or nearly the same", async () =>
		{
			const { erc20, erc20o } = await loadFixture(deployERC20MockFixture);

			const transactionReceipt = await ethers.provider.getTransactionReceipt(erc20.deployTransaction.hash);
			const gu = transactionReceipt.gasUsed;

			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(erc20o.deployTransaction.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedCreationGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "Contract creation", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Contract creation is too expensive");
		});


		it("ERC20.approve: Should be cheaper or nearly the same", async () =>
		{
			// Arrange
			const { erc20, erc20o, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.approve(bob.address, 10);
			const resultOriginal = await erc20o.approve(bob.address, 10);

			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "approve(address spender, uint256 amount)", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});

		it("ERC20.transfer: Should be cheaper or nearly the same", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			// Act
			const result = await erc20.transfer(carol.address, 10);
			const resultOriginal = await erc20o.transfer(carol.address, 10);
			// Assert
			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "transfer(address to, uint256 amount)", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});

		it("ERC20.transferFrom: Should be cheaper or nearly the same", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, 50);
			await erc20o.approve(bob.address, 50);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			const resultOriginal = await erc20o.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "transferFrom(address from, address to, uint256 amount)", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});

		it("ERC20.transferFrom: Should be cheaper or nearly the same 2", async () =>
		{
			// Arrange
			const { erc20, erc20o, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20o.mockMint(alice.address, 100);
			await erc20.approve(bob.address, UINT256_MAX);
			await erc20o.approve(bob.address, UINT256_MAX);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			const resultOriginal = await erc20o.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "transferFrom(address from, address to, uint256 amount) 2", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});

		it("ERC20.decreaseAllowance: Should be cheaper or nearly the same", async () =>
		{
			// Arrange
			const { erc20, erc20o, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			await erc20o.increaseAllowance(bob.address, 100);
			// Act
			const result = await erc20.decreaseAllowance(bob.address, 50);
			const resultOriginal = await erc20o.decreaseAllowance(bob.address, 50);
			// Assert
			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "decreaseAllowance(address spender, uint256 subtractedValue)", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});

		it("ERC20.increaseAllowance: Should be cheaper or nearly the same", async () =>
		{
			// Arrange
			const { erc20, erc20o, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.increaseAllowance(bob.address, 50);
			const resultOriginal = await erc20o.increaseAllowance(bob.address, 50);
			// Assert
			const transactionReceipt = await ethers.provider.getTransactionReceipt(result.hash);
			const gu = transactionReceipt.gasUsed;
			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(resultOriginal.hash);
			const guo = transactionReceiptOriginal.gasUsed;

			const allowedDiff = guo.mul(AllowedTransactionGasDiffPercent).div(100);
			const guf = gu.sub(allowedDiff);

			let warnLevel = undefined;
			if (gu > guo)
			{
				warnLevel = 1;
				if (guf > guo)
				{
					warnLevel = 2;
				}
			}
			GasTable.push({ description: "increaseAllowance(address spender, uint256 addedValue)", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});
	});
});

