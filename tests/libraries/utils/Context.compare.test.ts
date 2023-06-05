import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContextMock, ContextMock_Original } from "../../../typechain-types";

describe("Context Compare @compare", async () =>
{
	async function deployContextMockFixture(): Promise<{ context: ContextMock, contextOriginal: ContextMock_Original, alice: SignerWithAddress, bob: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];

		const ContextMockFactory = await ethers.getContractFactory("ContextMock");
		const context = await ContextMockFactory.deploy();

		const ContextMockOriginalFactory = await ethers.getContractFactory("ContextMock_Original");
		const contextOriginal = await ContextMockOriginalFactory.deploy();

		return { context, contextOriginal, alice, bob };
	}

	describe("Ensure same behavior", async () =>
	{
		it("Context.msgData: Should return same message data", async () =>
		{
			// Arrange
			const { context, contextOriginal, bob } = await loadFixture(deployContextMockFixture);
			const usedAddress = bob.address;
			const usedUint256 = 15678431;
			const usedUint32 = 12345;
			// Act
			const result = await context.mockMsgData();
			const result2 = await context.mockMsgData2(usedAddress, usedUint256, usedUint32);
			const resultOriginal = await contextOriginal.mockMsgData();
			const result2Original = await contextOriginal.mockMsgData2(usedAddress, usedUint256, usedUint32);
			// Assert
			expect(result).to.equal(resultOriginal);
			expect(result2).to.equal(result2Original);
		});

		it("Context.msgSender: Should return same message sender", async () =>
		{
			// Arrange
			const { context, contextOriginal, bob } = await loadFixture(deployContextMockFixture);
			// Act
			const resultAlice = await context.mockMsgSender();
			const resultBob = await context.connect(bob).mockMsgSender();
			const resultAliceOriginal = await contextOriginal.mockMsgSender();
			const resultBobOriginal = await contextOriginal.connect(bob).mockMsgSender();
			// Assert
			expect(resultAlice).to.equal(resultAliceOriginal);
			expect(resultBob).to.equal(resultBobOriginal);
		});
	});
});
