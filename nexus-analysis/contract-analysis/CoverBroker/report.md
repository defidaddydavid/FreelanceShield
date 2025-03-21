# CoverBroker Contract Analysis

## Overview
- **Address**: 0x0000cbD7a26f72Ff222bf5f136901D224b08BE4E
- **Category**: Insurance
- **Description**: Third-party sales middleware

## Contract Patterns
- Uses Proxy
- Uses SafeERC20
- Uses AccessControl
- Uses ReentrancyGuard
- Uses ERC721
- Uses ERC20
- Uses Oracles

## Functions (12)
### ETH
- **Signature**: `ETH()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### buyCover
- **Signature**: `buyCover(tuple params, tuple[] poolAllocationRequests)`
- **Visibility**: payable
- **Returns**: uint256 coverId
- **Constant**: false
- **Payable**: false

### cover
- **Signature**: `cover()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### master
- **Signature**: `master()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### maxApproveCoverContract
- **Signature**: `maxApproveCoverContract(address erc20)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### memberRoles
- **Signature**: `memberRoles()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### nxmToken
- **Signature**: `nxmToken()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### owner
- **Signature**: `owner()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### renounceOwnership
- **Signature**: `renounceOwnership()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### rescueFunds
- **Signature**: `rescueFunds(address assetAddress)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### switchMembership
- **Signature**: `switchMembership(address newAddress)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### transferOwnership
- **Signature**: `transferOwnership(address newOwner)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (1)
### OwnershipTransferred
- **Signature**: `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`
- **Anonymous**: false


## State Variables (1)
- `address private _owner;`
