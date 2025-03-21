# StakingProducts Contract Analysis

## Overview
- **Address**: 0xcafea573fBd815B5f59e8049E71E554bde3477E4
- **Category**: Staking
- **Description**: Product staking definitions

## Contract Patterns
- Uses Proxy

## Functions (4)
### implementation
- **Signature**: `implementation()`
- **Visibility**: view
- **Returns**: address impl
- **Constant**: false
- **Payable**: false

### proxyOwner
- **Signature**: `proxyOwner()`
- **Visibility**: view
- **Returns**: address owner
- **Constant**: false
- **Payable**: false

### transferProxyOwnership
- **Signature**: `transferProxyOwnership(address _newOwner)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### upgradeTo
- **Signature**: `upgradeTo(address _implementation)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (2)
### ProxyOwnershipTransferred
- **Signature**: `ProxyOwnershipTransferred(address  previousOwner, address  newOwner)`
- **Anonymous**: false

### Upgraded
- **Signature**: `Upgraded(address indexed implementation)`
- **Anonymous**: false


## State Variables (0)

