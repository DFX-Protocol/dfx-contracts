import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ContextMock } from "../../../typechain-types";

describe("Context", async () =>
{
	async function deployContextMockFixture(): Promise<{ context: ContextMock, alice: SignerWithAddress, bob: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];

		const ContextMockFactory = await ethers.getContractFactory("ContextMock");
		const context = await ContextMockFactory.deploy();

		return { context, alice, bob };
	}

	describe("Context", async () =>
	{
		it("Context.msgData: Should allow to get message data", async () =>
		{
			// Arrange
			const { context, bob } = await loadFixture(deployContextMockFixture);
			const methodId = keccak256(toUtf8Bytes("mockMsgData()")).substring(0, 10);
			const methodId2 = keccak256(toUtf8Bytes("mockMsgData2(address,uint256,uint32)")).substring(0, 10);
			const usedAddress = bob.address;
			const usedUint256 = 15678431;
			const usedUint32 = 12345;
			const abi = new ethers.utils.AbiCoder();
			const encodedParameters = abi.encode(["address", "uint256", "uint32"], [usedAddress, usedUint256, usedUint32]).substring(2);
			const expectedResult2 = methodId2 + encodedParameters;
			// Act
			const result = await context.mockMsgData();
			const result2 = await context.mockMsgData2(usedAddress, usedUint256, usedUint32);
			// Assert
			expect(result).to.equal(methodId);
			expect(result2).to.equal(expectedResult2);
		});

		it("Context.msgSender: Should allow to get message sender", async () =>
		{
			// Arrange
			const { context, alice, bob } = await loadFixture(deployContextMockFixture);
			// Act
			const resultAlice = await context.mockMsgSender();
			const resultBob = await context.connect(bob).mockMsgSender();
			// Assert
			expect(resultAlice).to.equal(alice.address);
			expect(resultBob).to.equal(bob.address);
		});
	});
});
