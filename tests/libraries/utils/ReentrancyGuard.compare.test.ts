import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { INotifyMock, INotifyMock_Original, IReentrancyProtectedMock, IReentrancyProtectedMock_Original } from "../../../typechain-types";
import { FormatTableColumn, FormatTableTitle } from "../../helpers";

describe("ReentrancyGuard Compare @compare", async () =>
{
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployReentrancyGuardCompareFixture(): Promise<{ rpm: IReentrancyProtectedMock, rpmo: IReentrancyProtectedMock_Original, goodNotify: INotifyMock, goodNotifyOriginal: INotifyMock_Original, maliciousNotify: INotifyMock, maliciousNotifyOriginal: INotifyMock_Original }>
	{
		const ReentrancyProtectedMockFactory = await ethers.getContractFactory("ReentrancyProtectedMock");
		const rpm = await ReentrancyProtectedMockFactory.deploy();

		const ReentrancyProtectedMockOriginalFactory = await ethers.getContractFactory("ReentrancyProtectedMock_Original");
		const rpmo = await ReentrancyProtectedMockOriginalFactory.deploy();

		const GoodNotifyFactory = await ethers.getContractFactory("GoodNotifyMock");
		const goodNotify = await GoodNotifyFactory.deploy();

		const GoodNotifyOriginalFactory = await ethers.getContractFactory("GoodNotifyMock_Original");
		const goodNotifyOriginal = await GoodNotifyOriginalFactory.deploy();

		const MaliciousNotifyFactory = await ethers.getContractFactory("MaliciousNotifyMock");
		const maliciousNotify = await MaliciousNotifyFactory.deploy(rpm.address);

		const MaliciousNotifyOriginalFactory = await ethers.getContractFactory("MaliciousNotifyMock_Original");
		const maliciousNotifyOriginal = await MaliciousNotifyOriginalFactory.deploy(rpmo.address);

		return { rpm, rpmo, goodNotify, goodNotifyOriginal, maliciousNotify, maliciousNotifyOriginal };
	}

	describe("Ensure same behavior", async () =>
	{
		it("Should work with good contract", async () =>
		{
			const { rpm, rpmo, goodNotify, goodNotifyOriginal } = await loadFixture(deployReentrancyGuardCompareFixture);

			const result = rpm.protected(goodNotify.address);
			const resultOriginal = rpmo.protected(goodNotifyOriginal.address);

			await expect(result).to.be.not.reverted;
			await expect(resultOriginal).to.be.not.reverted;
		});

		it("Should revert with malicious contract", async () =>
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { rpm, rpmo, goodNotify, goodNotifyOriginal, maliciousNotify, maliciousNotifyOriginal } = await loadFixture(deployReentrancyGuardCompareFixture);

			const result = rpm.protected(maliciousNotify.address);
			await expect(result).to.be.revertedWithCustomError(rpm, "ReentrantCall");

			const resultOriginal = rpmo.protected(maliciousNotifyOriginal.address);
			await expect(resultOriginal).to.be.revertedWith("ReentrancyGuard: reentrant call");
		});
	});

	describe("Gas", async () =>
	{
		const AllowedCreationGasDiffPercent = 15;
		const AllowedTransactionGasDiffPercent = 1;
		const GasTable: Array<{ description: string, newGasUsed: BigNumber, oldGasUsed: BigNumber, warnLevel?: number }> = [];

		after(async () =>
		{
			const formatedTitle = FormatTableTitle(102, "Gas statistics for ReentrancyGuard", "center");
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
			const { rpm, rpmo } = await loadFixture(deployReentrancyGuardCompareFixture);

			const transactionReceipt = await ethers.provider.getTransactionReceipt(rpm.deployTransaction.hash);
			const gu = transactionReceipt.gasUsed;

			const transactionReceiptOriginal = await ethers.provider.getTransactionReceipt(rpmo.deployTransaction.hash);
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

		it("Modifier should be cheaper or nearly the same", async () =>
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { rpm, rpmo, goodNotify, goodNotifyOriginal } = await loadFixture(deployReentrancyGuardCompareFixture);

			const result = await rpm.protected(goodNotify.address);
			const resultOriginal = await rpmo.protected(goodNotifyOriginal.address);
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
			GasTable.push({ description: "Modifier 'nonReentrant()' protected function", newGasUsed: gu, oldGasUsed: guo, warnLevel: warnLevel });

			assert.isBelow(guf.toNumber(), guo.toNumber(), "Transaction is too expensive");
		});
	});
});
