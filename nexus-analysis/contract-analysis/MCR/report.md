# MCR Contract Analysis

## Overview
- **Address**: 0xcafea92739e411a4D95bbc2275CA61dE6993C9a7
- **Category**: Risk
- **Description**: Minimum Capital Requirements

## Contract Patterns


## Functions (21)
### BASIS_PRECISION
- **Signature**: `BASIS_PRECISION()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### MAX_MCR_ADJUSTMENT
- **Signature**: `MAX_MCR_ADJUSTMENT()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### MCR_UPDATE_DEADLINE
- **Signature**: `MCR_UPDATE_DEADLINE()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### changeDependentContractAddress
- **Signature**: `changeDependentContractAddress()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### changeMasterAddress
- **Signature**: `changeMasterAddress(address masterAddress)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### desiredMCR
- **Signature**: `desiredMCR()`
- **Visibility**: view
- **Returns**: uint80 
- **Constant**: false
- **Payable**: false

### gearingFactor
- **Signature**: `gearingFactor()`
- **Visibility**: view
- **Returns**: uint24 
- **Constant**: false
- **Payable**: false

### getGearedMCR
- **Signature**: `getGearedMCR()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getMCR
- **Signature**: `getMCR()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getTotalActiveCoverAmount
- **Signature**: `getTotalActiveCoverAmount()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### internalContracts
- **Signature**: `internalContracts(uint256 )`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### lastUpdateTime
- **Signature**: `lastUpdateTime()`
- **Visibility**: view
- **Returns**: uint32 
- **Constant**: false
- **Payable**: false

### master
- **Signature**: `master()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### maxMCRIncrement
- **Signature**: `maxMCRIncrement()`
- **Visibility**: view
- **Returns**: uint16 
- **Constant**: false
- **Payable**: false

### mcr
- **Signature**: `mcr()`
- **Visibility**: view
- **Returns**: uint80 
- **Constant**: false
- **Payable**: false

### minUpdateTime
- **Signature**: `minUpdateTime()`
- **Visibility**: view
- **Returns**: uint16 
- **Constant**: false
- **Payable**: false

### previousMCR
- **Signature**: `previousMCR()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### teleportMCR
- **Signature**: `teleportMCR()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateMCR
- **Signature**: `updateMCR()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateMCRInternal
- **Signature**: `updateMCRInternal(bool forceUpdate)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateUintParameters
- **Signature**: `updateUintParameters(bytes8 code, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (1)
### MCRUpdated
- **Signature**: `MCRUpdated(uint256  mcr, uint256  desiredMCR, uint256  mcrFloor, uint256  mcrETHWithGear, uint256  totalSumAssured)`
- **Anonymous**: false


## State Variables (0)

