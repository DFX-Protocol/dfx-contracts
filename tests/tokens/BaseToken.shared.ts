import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ADDRESS_ZERO } from "../helpers";
import { IBaseToken, IERC20Mock, IYieldTracker } from "../../typechain-types";
import { GeneralTests } from "../helpers/shared/General.shared";


export class IBaseTokenTests extends GeneralTests<Promise<{ token: IBaseToken; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; yieldTrackers: IYieldTracker[]; dummyToken: IERC20Mock; }>>
{
	protected _name: string;
	protected _symbol: string;
	protected _decimals: number;

	protected override Context = context("IBaseToken", async () =>
	{
		this.AddAdmin_ShouldAllowGovenorToAddAdmin();
		this.AddAdmin_ShouldNotAllowNonGovenorToAddAdmin();
		this.AddNonStakingAccount_ShouldAllowAdminToAddNonStakingAccountWithNoYieldTrackersSet();
		this.AddNonStakingAccount_ShouldAllowAdminToAddNonStakingAccountWithYieldTrackersSet();
		this.AddNonStakingAccount_ShouldNotAllowNonAdminToAddNonStakingAccount();
		this.AddNonStakingAccount_ShouldNotAllowToAddAlreadyAddedNonStakingAccount();
		this.Claim_ShouldCallClaimForEachYieldTracker();
		this.RecoverClaim_ShouldAllowAdminToCallClaimForEachYieldTracker();
		this.RecoverClaim_ShouldNotAllowNonAdminToCallClaimForEachYieldTracker();
		this.RemoveAdmin_ShouldAllowGovenorToRemoveAdmin();
		this.RemoveAdmin_ShouldNotAllowNonGovenorToRemoveAdmin();
		this.RemoveNonStakingAccount_ShouldAllowAdminToRemoveNonStakingAccountWithNoYieldTrackersSet();
		this.RemoveNonStakingAccount_ShouldAllowAdminToRemoveNonStakingAccountWithYieldTrackersSet();
		this.RemoveNonStakingAccount_ShouldNotAllowNonAdminToRemoveNonStakingAccount();
		this.RemoveNonStakingAccount_ShouldNotAllowToRemoveMarkedNonStakingAccountTwice();
		this.RemoveNonStakingAccount_ShouldNotAllowToRemoveUnmarkedNonStakingAccount();
		this.SetHandler_ShouldAllowGovenorToSetHandler();
		this.SetHandler_ShouldAllowGovenorToUnsetHandler();
		this.SetHandler_ShouldNotAllowNonGovenorToSetHandler();
		this.SetInPrivateTransferMode_ShouldAllowGovenorToSetPrivateTransferMode();
		this.SetInPrivateTransferMode_ShouldAllowGovenorToUnsetPrivateTransferMode();
		this.SetInPrivateTransferMode_ShouldNotAllowNonGovenorToSetPrivateTransferMode();
		this.SetInfo_ShouldAllowGovenorToChangeNameAndSymbolOfToken();
		this.SetInfo_ShouldNotAllowNonGovenorToChangeNameAndSymbolOfToken();
		this.SetYieldTrackers_ShouldAllowGovenorToSetYieldTrackers();
		this.SetYieldTrackers_ShouldNotAllowNonGovenorToSetYieldTrackers();
		this.WithdrawToken_ShouldAllowGovenorToWithdrawToken();
		this.WithdrawToken_ShouldNotAllowNonGovenorToWithdrawToken();
	});

	constructor(deployFixture: () => Promise<{ token: IBaseToken; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; yieldTrackers: IYieldTracker[]; dummyToken: IERC20Mock; }>, name: string, symbol: string, decimals: number, inheritedTests?: GeneralTests<unknown>[])
	{
		super(deployFixture, inheritedTests);
		this._name = name;
		this._symbol = symbol;
		this._decimals = decimals;
	}

	AddAdmin_ShouldAllowGovenorToAddAdmin(): Mocha.Test
	{
		return it("addAdmin: Should allow govenor to add admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Alice is govenor
			await token.addAdmin(bob.address);
			// Assert
			expect(await token.admins(bob.address)).to.be.true;
		});
	}

	AddAdmin_ShouldNotAllowNonGovenorToAddAdmin(): Mocha.Test
	{
		return it("addAdmin: Should not allow non govenor to add admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).addAdmin(bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
			expect(await token.admins(bob.address)).to.be.false;
		});
	}

	AddNonStakingAccount_ShouldAllowAdminToAddNonStakingAccountWithNoYieldTrackersSet(): Mocha.Test
	{
		return it("addNonStakingAccount: Should allow admin to add non staking account with no yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			// Act
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.true;
			expect(await token.nonStakingSupply()).to.equal(100);
		});
	}

	AddNonStakingAccount_ShouldAllowAdminToAddNonStakingAccountWithYieldTrackersSet(): Mocha.Test
	{
		return it("addNonStakingAccount: Should allow admin to add non staking account with yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol, yieldTrackers } = await loadFixture(this._deployFixture);
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
	}

	AddNonStakingAccount_ShouldNotAllowNonAdminToAddNonStakingAccount(): Mocha.Test
	{
		return it("addNonStakingAccount: Should not allow non admin to add non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			// Act
			const result = token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyAdmin");
		});
	}

	AddNonStakingAccount_ShouldNotAllowToAddAlreadyAddedNonStakingAccount(): Mocha.Test
	{
		return it("addNonStakingAccount: Should not allow to add already added non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			const result = token.connect(bob).addNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountAlreadyMarked").withArgs(carol.address);
		});
	}

	Claim_ShouldCallClaimForEachYieldTracker(): Mocha.Test
	{
		return it("claim: Should call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, yieldTrackers } = await loadFixture(this._deployFixture);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.claim(bob.address);
			// Assert
			await expect(result).to.emit(yieldTrackers[0], "Claim(address,address)").withArgs(alice.address, bob.address);
			await expect(result).to.emit(yieldTrackers[1], "Claim(address,address)").withArgs(alice.address, bob.address);
		});
	}

	RecoverClaim_ShouldAllowAdminToCallClaimForEachYieldTracker(): Mocha.Test
	{
		return it("recoverClaim: Should allow admin to call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, carol, yieldTrackers } = await loadFixture(this._deployFixture);
			await token.addAdmin(alice.address);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = await token.recoverClaim(carol.address, bob.address);
			// Assert
			await expect(result).to.emit(yieldTrackers[0], "Claim(address,address)").withArgs(carol.address, bob.address);
			await expect(result).to.emit(yieldTrackers[1], "Claim(address,address)").withArgs(carol.address, bob.address);
		});
	}

	RecoverClaim_ShouldNotAllowNonAdminToCallClaimForEachYieldTracker(): Mocha.Test
	{
		return it("recoverClaim: Should not allow non admin to call claim for each yield tracker", async () =>
		{
			// Arrange
			const { token, alice, bob, carol, yieldTrackers } = await loadFixture(this._deployFixture);
			await token.setYieldTrackers(yieldTrackers.map(yt => yt.address));
			// Act
			const result = token.recoverClaim(carol.address, bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(alice.address, "onlyAdmin");
		});
	}

	RemoveAdmin_ShouldAllowGovenorToRemoveAdmin(): Mocha.Test
	{
		return it("removeAdmin: Should allow govenor to remove admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			await token.addAdmin(bob.address);
			// Act
			// Alice is govenor
			await token.removeAdmin(bob.address);
			// Assert
			expect(await token.admins(bob.address)).to.be.false;
		});
	}

	RemoveAdmin_ShouldNotAllowNonGovenorToRemoveAdmin(): Mocha.Test
	{
		return it("removeAdmin: Should not allow non govenor to remove admin", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			await token.addAdmin(bob.address);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).removeAdmin(bob.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
			expect(await token.admins(bob.address)).to.be.true;
		});
	}

	RemoveNonStakingAccount_ShouldAllowAdminToRemoveNonStakingAccountWithNoYieldTrackersSet(): Mocha.Test
	{
		return it("removeNonStakingAccount: Should allow admin to remove non staking account with no yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			await token.transfer(carol.address, 100);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			await token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			expect(await token.nonStakingAccounts(carol.address)).to.be.false;
			expect(await token.nonStakingSupply()).to.equal(0);
		});
	}

	RemoveNonStakingAccount_ShouldAllowAdminToRemoveNonStakingAccountWithYieldTrackersSet(): Mocha.Test
	{
		return it("removeNonStakingAccount: Should allow admin to remove non staking account with yield trackers set", async () =>
		{
			// Arrange
			const { token, bob, carol, yieldTrackers } = await loadFixture(this._deployFixture);
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
	}

	RemoveNonStakingAccount_ShouldNotAllowNonAdminToRemoveNonStakingAccount(): Mocha.Test
	{
		return it("removeNonStakingAccount: Should not allow non admin to remove non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			// Act
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyAdmin");
		});
	}

	RemoveNonStakingAccount_ShouldNotAllowToRemoveUnmarkedNonStakingAccount(): Mocha.Test
	{
		return it("removeNonStakingAccount: Should not allow to remove unmarked non staking account", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			await token.addAdmin(bob.address);
			// Act
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountNotMarked").withArgs(carol.address);
		});
	}

	RemoveNonStakingAccount_ShouldNotAllowToRemoveMarkedNonStakingAccountTwice(): Mocha.Test
	{
		return it("removeNonStakingAccount: Should not allow to remove marked non staking account twice", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			await token.addAdmin(bob.address);
			await token.connect(bob).addNonStakingAccount(carol.address);
			// Act
			await token.connect(bob).removeNonStakingAccount(carol.address);
			const result = token.connect(bob).removeNonStakingAccount(carol.address);
			// Assert
			await expect(result).revertedWithCustomError(token, "NonStakingAccountNotMarked").withArgs(carol.address);
		});
	}

	SetHandler_ShouldAllowGovenorToSetHandler(): Mocha.Test
	{
		return it("setHandler: Should allow govenor to set handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Alice is govenor
			await token.setHandler(bob.address, true);
			// Assert
			expect(await token.isHandler(bob.address)).to.be.true;
		});
	}

	SetHandler_ShouldNotAllowNonGovenorToSetHandler(): Mocha.Test
	{
		return it("setHandler: Should not allow non govenor to set handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setHandler(bob.address, true);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});
	}

	SetHandler_ShouldAllowGovenorToUnsetHandler(): Mocha.Test
	{
		return it("setHandler: Should allow govenor to unset handler", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			await token.setHandler(bob.address, true);
			// Act
			// Alice is govenor
			await token.setHandler(bob.address, false);
			// Assert
			expect(await token.isHandler(bob.address)).to.be.false;
		});
	}

	SetInfo_ShouldAllowGovenorToChangeNameAndSymbolOfToken(): Mocha.Test
	{
		return it("setInfo: Should allow govenor to change name and symbol of token", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			// Alice is govenor
			await token.setInfo("New Base Token Name", "NBTS");
			// Assert
			expect(await token.name()).to.equal("New Base Token Name");
			expect(await token.symbol()).to.equal("NBTS");
		});
	}

	SetInfo_ShouldNotAllowNonGovenorToChangeNameAndSymbolOfToken(): Mocha.Test
	{
		return it("setInfo: Should not allow non govenor to change name and symbol of token", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setInfo("New Base Token Name", "NBTS");
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});
	}

	SetInPrivateTransferMode_ShouldAllowGovenorToSetPrivateTransferMode(): Mocha.Test
	{
		return it("setInPrivateTransferMode: Should allow govenor to set private transfer mode", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			// Alice is govenor
			await token.setInPrivateTransferMode(true);
			// Assert
			expect(await token.inPrivateTransferMode()).to.be.true;
		});
	}

	SetInPrivateTransferMode_ShouldNotAllowNonGovenorToSetPrivateTransferMode(): Mocha.Test
	{
		return it("setInPrivateTransferMode: Should not allow non govenor to set private transfer mode", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setInPrivateTransferMode(true);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});
	}

	SetInPrivateTransferMode_ShouldAllowGovenorToUnsetPrivateTransferMode(): Mocha.Test
	{
		return it("setInPrivateTransferMode: Should allow govenor to unset private transfer mode", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			await token.setInPrivateTransferMode(true);
			// Act
			// Alice is govenor
			await token.setInPrivateTransferMode(false);
			// Assert
			expect(await token.inPrivateTransferMode()).to.be.false;
		});
	}

	SetYieldTrackers_ShouldAllowGovenorToSetYieldTrackers(): Mocha.Test
	{
		return it("setYieldTrackers: Should allow govenor to set yield trackers", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			// Act
			// Alice is govenor
			await token.setYieldTrackers([bob.address, carol.address]);
			// Assert
			expect(await token.yieldTrackers(0)).to.equal(bob.address);
			expect(await token.yieldTrackers(1)).to.equal(carol.address);
		});
	}

	SetYieldTrackers_ShouldNotAllowNonGovenorToSetYieldTrackers(): Mocha.Test
	{
		return it("setYieldTrackers: Should not allow non govenor to set yield trackers", async () =>
		{
			// Arrange
			const { token, bob, carol } = await loadFixture(this._deployFixture);
			// Act
			// Bob is not a govenor
			const result = token.connect(bob).setYieldTrackers([bob.address, carol.address]);
			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});
	}

	WithdrawToken_ShouldAllowGovenorToWithdrawToken(): Mocha.Test
	{
		return it("withdrawToken: Should allow govenor to withdraw token", async () =>
		{
			// Arrange
			const { token, alice, bob, dummyToken } = await loadFixture(this._deployFixture);
			await dummyToken.mockMint(bob.address, 1000);
			await dummyToken.connect(bob).transfer(token.address, 1000); // Bob does a mistake

			// Act
			await token.withdrawToken(dummyToken.address, bob.address, 990); // Now alice has to fix it
			await token.withdrawToken(dummyToken.address, alice.address, 10); // But she keep some tokens as a fee

			// Assert
			expect(await dummyToken.balanceOf(bob.address)).to.equal(990);
			expect(await dummyToken.balanceOf(alice.address)).to.equal(10);
			expect(await dummyToken.balanceOf(token.address)).to.equal(0);
		});
	}

	WithdrawToken_ShouldNotAllowNonGovenorToWithdrawToken(): Mocha.Test
	{
		return it("withdrawToken: Should not allow non govenor to withdraw token", async () =>
		{
			// Arrange
			const { token, bob } = await loadFixture(this._deployFixture);
			// Act
			const result = token.connect(bob).withdrawToken(ADDRESS_ZERO, ADDRESS_ZERO, 100); // Values do not matter 

			// Assert
			await expect(result).revertedWithCustomError(token, "PermissionDenied").withArgs(bob.address, "onlyGov");
		});
	}
}
