# NXMToken Contract Analysis

## Overview
- **Address**: 0xd7c49CEE7E9188cCa6AD8FF264C1DA2e69D4Cf3B
- **Category**: Tokenomics
- **Description**: Native token

## Contract Patterns
- Uses ERC20
- Uses Math

## Functions (22)
### removeFromWhiteList
- **Signature**: `removeFromWhiteList(address _member)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### changeOperator
- **Signature**: `changeOperator(address _newOperator)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### name
- **Signature**: `name()`
- **Visibility**: view
- **Returns**: string 
- **Constant**: true
- **Payable**: false

### approve
- **Signature**: `approve(address spender, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### totalSupply
- **Signature**: `totalSupply()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### transferFrom
- **Signature**: `transferFrom(address from, address to, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### decimals
- **Signature**: `decimals()`
- **Visibility**: view
- **Returns**: uint8 
- **Constant**: true
- **Payable**: false

### increaseAllowance
- **Signature**: `increaseAllowance(address spender, uint256 addedValue)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### mint
- **Signature**: `mint(address account, uint256 amount)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### burn
- **Signature**: `burn(uint256 amount)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### addToWhiteList
- **Signature**: `addToWhiteList(address _member)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### lockForMemberVote
- **Signature**: `lockForMemberVote(address _of, uint256 _days)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### operator
- **Signature**: `operator()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: true
- **Payable**: false

### balanceOf
- **Signature**: `balanceOf(address owner)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### burnFrom
- **Signature**: `burnFrom(address from, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### symbol
- **Signature**: `symbol()`
- **Visibility**: view
- **Returns**: string 
- **Constant**: true
- **Payable**: false

### isLockedForMV
- **Signature**: `isLockedForMV(address )`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### decreaseAllowance
- **Signature**: `decreaseAllowance(address spender, uint256 subtractedValue)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### transfer
- **Signature**: `transfer(address to, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### operatorTransfer
- **Signature**: `operatorTransfer(address from, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### allowance
- **Signature**: `allowance(address owner, address spender)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### whiteListed
- **Signature**: `whiteListed(address )`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: true
- **Payable**: false


## Events (4)
### WhiteListed
- **Signature**: `WhiteListed(address indexed member)`
- **Anonymous**: false

### BlackListed
- **Signature**: `BlackListed(address indexed member)`
- **Anonymous**: false

### Transfer
- **Signature**: `Transfer(address indexed from, address indexed to, uint256  value)`
- **Anonymous**: false

### Approval
- **Signature**: `Approval(address indexed owner, address indexed spender, uint256  value)`
- **Anonymous**: false


## State Variables (5)
- `uint256 private _totalSupply;`
- `string public name = "NXM";`
- `string public symbol = "NXM";`
- `uint8 public decimals = 18;`
- `address public operator;`
