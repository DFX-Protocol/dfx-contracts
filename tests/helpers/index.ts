import { BigNumber } from "ethers";

export { FormatTableColumn, FormatTableTitle } from "./fomaters/TableFormaters";
export { EmitOnlyThis } from "./checks/EmitOnlyThisCheck";
export { StartAutomine, StopAutomine } from "./mine/Automine";
export { AdvanceBlock, AdvanceBlockTo, GetBlockNumber } from "./mine/Blocks";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const UINT256_MAX = BigNumber.from(2).pow(256).sub(1);
