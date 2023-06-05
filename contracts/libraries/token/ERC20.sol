// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Context } from "../utils/Context.sol";

error AllowanceBelowZero(uint256 currentAllowance, uint256 subtractedValue);
error InsufficientAllowance(uint256 currentAllowance, uint256 amount);
error InvalidAddress(address usedAddress, string message);
error AmountExceedsBalance(address usedAddress, uint256 balance, uint256 amount);

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
	/**
	 * @dev Returns the amount of tokens in existence.
	 */
	function totalSupply() external view returns (uint256);

	/**
	 * @dev Returns the amount of tokens owned by `account`.
	 */
	function balanceOf(address account) external view returns (uint256);

	/**
	 * @dev Moves `amount` tokens from the caller's account to `recipient`.
	 *
	 * Returns a boolean value indicating whether the operation succeeded.
	 *
	 * Emits a {Transfer} event.
	 */
	function transfer(address recipient, uint256 amount) external returns (bool);

	/**
	 * @dev Returns the remaining number of tokens that `spender` will be
	 * allowed to spend on behalf of `owner` through {transferFrom}. This is
	 * zero by default.
	 *
	 * This value changes when {approve} or {transferFrom} are called.
	 */
	function allowance(address owner, address spender) external view returns (uint256);

	/**
	 * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
	 *
	 * Returns a boolean value indicating whether the operation succeeded.
	 *
	 * IMPORTANT: Beware that changing an allowance with this method brings the risk
	 * that someone may use both the old and the new allowance by unfortunate
	 * transaction ordering. One possible solution to mitigate this race
	 * condition is to first reduce the spender's allowance to 0 and set the
	 * desired value afterwards:
	 * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
	 *
	 * Emits an {Approval} event.
	 */
	function approve(address spender, uint256 amount) external returns (bool);

	/**
	 * @dev Moves `amount` tokens from `sender` to `recipient` using the
	 * allowance mechanism. `amount` is then deducted from the caller's
	 * allowance.
	 *
	 * Returns a boolean value indicating whether the operation succeeded.
	 *
	 * Emits a {Transfer} event.
	 */
	function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

	/**
	 * @dev Emitted when `value` tokens are moved from one account (`from`) to
	 * another (`to`).
	 *
	 * Note that `value` may be zero.
	 */
	event Transfer(address indexed from, address indexed to, uint256 value);

	/**
	 * @dev Emitted when the allowance of a `spender` for an `owner` is set by
	 * a call to {approve}. `value` is the new allowance.
	 */
	event Approval(address indexed owner, address indexed spender, uint256 value);
}

/// @title ERC20AltApprove interface.
/// @notice Interface for an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}.
/// @dev This is not part of the ERC20 specification.
interface IERC20AltApprove
{
	/**
	* @notice Atomically decreases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	* - `spender` must have allowance for the caller of at least
	* `subtractedValue`.
	*/
	function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

	/**
	* @notice Atomically increases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	*/
	function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
}

/// @title ERC20Metadata interface.
/// @notice Interface for the optional metadata functions from the ERC20 standard.
interface IERC20Metadata is IERC20
{
	/// @notice Returns the name of the token.
	/// @return The token name.
	function name() external view returns (string memory);

	/// @notice Returns the symbol of the token.
	/// @return The symbol for the token.
	function symbol() external view returns (string memory);

	/// @notice Returns the decimals of the token.
	/// @return The decimals for the token.
	function decimals() external pure returns (uint8);
}

/**
* @notice Implementation of the {IERC20Metadata} interface.
* The IERC20Metadata interface extends the IERC20 interface.
*
* This implementation is agnostic to the way tokens are created. This means
* that a supply mechanism has to be added in a derived contract using {_mint}.
* For a generic mechanism see Open Zeppelins {ERC20PresetMinterPauser}.
*
* TIP: For a detailed writeup see our guide
* https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
* to implement supply mechanisms].
*
* We have followed general OpenZeppelin Contracts guidelines: functions revert
* instead returning `false` on failure. This behavior is nonetheless
* conventional and does not conflict with the expectations of ERC20
* applications.
*
* Additionally, an {Approval} event is emitted on calls to {transferFrom}.
* This allows applications to reconstruct the allowance for all accounts just
* by listening to said events. Other implementations of the EIP may not emit
* these events, as it isn't required by the specification.
*
* Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
* functions have been added to mitigate the well-known issues around setting
* allowances. See {IERC20-approve}.
*/
contract ERC20 is Context, IERC20AltApprove, IERC20Metadata
{
	uint256 internal _totalSupply;
	mapping(address => uint256) internal _balances;
	mapping(address => mapping(address => uint256)) internal _allowances;
	string internal _name;
	string internal _symbol;

	/**
	* @notice Sets the values for {name} and {symbol}.
	*
	* The default value of {decimals} is 18. To select a different value for
	* {decimals} you should overload it.
	*
	* All two of these values are immutable: they can only be set once during
	* construction.
	*/
	constructor(string memory tokenName, string memory tokenSymbol)
	{
		_name = tokenName;
		_symbol = tokenSymbol;
	}

	/**
	* @notice See {IERC20-approve}.
	*
	* NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
	* `transferFrom`. This is semantically equivalent to an infinite approval.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	*/
	function approve(address spender, uint256 amount) override external virtual returns (bool)
	{
		address owner = _msgSender();
		_approve(owner, spender, amount);
		return true;
	}

	/**
	* @notice Atomically decreases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	* - `spender` must have allowance for the caller of at least
	* `subtractedValue`.
	*/
	function decreaseAllowance(address spender, uint256 subtractedValue) override external virtual returns (bool)
	{
		address owner = _msgSender();
		uint256 currentAllowance = _allowances[owner][spender];
		if(currentAllowance < subtractedValue) revert AllowanceBelowZero(currentAllowance, subtractedValue);
		unchecked {
			_approve(owner, spender, currentAllowance - subtractedValue);
		}

		return true;
	}

	/**
	* @notice Atomically increases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	*/
	function increaseAllowance(address spender, uint256 addedValue) override external virtual returns (bool)
	{
		address owner = _msgSender();
		_approve(owner, spender, _allowances[owner][spender] + addedValue);
		return true;
	}

	/**
	* @notice See {IERC20-transfer}.
	*
	* Requirements:
	*
	* - `to` cannot be the zero address.
	* - the caller must have a balance of at least `amount`.
	*/
	function transfer(address to, uint256 amount) override external virtual returns (bool)
	{
		address owner = _msgSender();
		_transfer(owner, to, amount);
		return true;
	}

	/**
	* @notice See {IERC20-transferFrom}.
	*
	* Emits an {Approval} event indicating the updated allowance. This is not
	* required by the EIP. See the note at the beginning of {ERC20}.
	*
	* NOTE: Does not update the allowance if the current allowance is the maximum `uint256`.
	*
	* Requirements:
	*
	* - `from` and `to` cannot be the zero address.
	* - `from` must have a balance of at least `amount`.
	* - the caller must have allowance for ``from``'s tokens of at least
	* `amount`.
	*/
	function transferFrom(address from, address to, uint256 amount) override external virtual returns (bool)
	{
		address spender = _msgSender();
		_spendAllowance(from, spender, amount);
		_transfer(from, to, amount);
		return true;
	}

	/**
	* @notice See {IERC20-allowance}.
	*/
	function allowance(address owner, address spender) override external view virtual returns (uint256)
	{
		return _allowances[owner][spender];
	}

	/**
	* @notice See {IERC20-balanceOf}.
	*/
	function balanceOf(address account) override external view virtual returns (uint256)
	{
		return _balances[account];
	}

	/**
	* @notice Returns the name of the token.
	*/
	function name() override external view virtual returns (string memory)
	{
		return _name;
	}

	/**
	* @notice Returns the symbol of the token, usually a shorter version of the
	* name.
	*/
	function symbol() override external view virtual returns (string memory)
	{
		return _symbol;
	}

	/**
	* @notice See {IERC20-totalSupply}.
	*/
	function totalSupply() override external view virtual returns (uint256)
	{
		return _totalSupply;
	}

	/**
	* @notice Returns the number of decimals used to get its user representation.
	* For example, if `decimals` equals `2`, a balance of `505` tokens should
	* be displayed to a user as `5.05` (`505 / 10 ** 2`).
	*
	* Tokens usually opt for a value of 18, imitating the relationship between
	* Ether and Wei. This is the value {ERC20} uses, unless this function is
	* overridden;
	*
	* NOTE: This information is only used for _display_ purposes: it in
	* no way affects any of the arithmetic of the contract, including
	* {IERC20-balanceOf} and {IERC20-transfer}.
	*/
	function decimals() override external pure virtual returns (uint8)
	{
		return 18;
	}

	/**
	* @notice Sets `amount` as the allowance of `spender` over the `owner` s tokens.
	*
	* This internal function is equivalent to `approve`, and can be used to
	* e.g. set automatic allowances for certain subsystems, etc.
	*
	* Emits an {Approval} event.
	*
	* Requirements:
	*
	* - `owner` cannot be the zero address.
	* - `spender` cannot be the zero address.
	*/
	function _approve(address owner, address spender, uint256 amount) internal virtual
	{
		if(owner == address(0)) revert InvalidAddress(owner, "Can not approve from zero address.");
		if(spender == address(0)) revert InvalidAddress(spender, "Can not approve to zero address.");
		_allowances[owner][spender] = amount;
		emit Approval(owner, spender, amount);
	}

	/**
	* @notice Destroys `amount` tokens from `account`, reducing the
	* total supply.
	*
	* Emits a {Transfer} event with `to` set to the zero address.
	*
	* Requirements:
	*
	* - `account` cannot be the zero address.
	* - `account` must have at least `amount` tokens.
	*/
	function _burn(address account, uint256 amount) internal virtual {
		if(account == address(0)) revert InvalidAddress(account, "Can not burn from zero address.");

		uint256 accountBalance = _balances[account];
		if(accountBalance < amount) revert AmountExceedsBalance(account, accountBalance, amount);
		unchecked {
			_balances[account] = accountBalance - amount;
		}
		_totalSupply -= amount;

		emit Transfer(account, address(0), amount);
	}

	/** @notice Creates `amount` tokens and assigns them to `account`, increasing
	* the total supply.
	*
	* Emits a {Transfer} event with `from` set to the zero address.
	*
	* Requirements:
	*
	* - `account` cannot be the zero address.
	*/
	function _mint(address account, uint256 amount) internal virtual
	{
		if(account == address(0)) revert InvalidAddress(account, "Can not mint to zero address.");

		_totalSupply += amount;
		_balances[account] += amount;
		emit Transfer(address(0), account, amount);
	}

	/**
	* @notice Updates `owner` s allowance for `spender` based on spent `amount`.
	*
	* Does not update the allowance amount in case of infinite allowance.
	* Revert if not enough allowance is available.
	*
	* Might emit an {Approval} event.
	*/
	function _spendAllowance(address owner, address spender, uint256 amount) internal virtual
	{
		uint256 currentAllowance = _allowances[owner][spender];
		if (currentAllowance != type(uint256).max)
		{
			if(currentAllowance < amount) revert InsufficientAllowance(currentAllowance, amount);
			unchecked {
				_approve(owner, spender, currentAllowance - amount);
			}
		}
	}

	/**
	* @notice Moves `amount` of tokens from `sender` to `recipient`.
	*
	* This internal function is equivalent to {transfer}, and can be used to
	* e.g. implement automatic token fees, slashing mechanisms, etc.
	*
	* Emits a {Transfer} event.
	*
	* Requirements:
	*
	* - `from` cannot be the zero address.
	* - `to` cannot be the zero address.
	* - `from` must have a balance of at least `amount`.
	*/
	function _transfer(address from, address to, uint256 amount) internal virtual
	{
		if(from == address(0)) revert InvalidAddress(from, "Can not transfer from zero address.");
		if(to == address(0)) revert InvalidAddress(to, "Can not transfer to zero address.");

		uint256 fromBalance = _balances[from];
		if(fromBalance < amount) revert AmountExceedsBalance(from, fromBalance, amount);
		unchecked {
			_balances[from] = fromBalance - amount;
		}
		_balances[to] += amount;

		emit Transfer(from, to, amount);
	}
}