# PriceFeedOracle Contract Analysis

## Overview
- **Address**: 0xcafea905B417AC7778843aaE1A0b3848CA97a592
- **Category**: Tokenomics
- **Description**: Insurance pricing data

## Contract Patterns
- Uses Oracles

## Functions (7)
### ETH
- **Signature**: `ETH()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### assets
- **Signature**: `assets(address assetAddress)`
- **Visibility**: view
- **Returns**: address , uint8 
- **Constant**: false
- **Payable**: false

### assetsMap
- **Signature**: `assetsMap(address )`
- **Visibility**: view
- **Returns**: address aggregator, uint8 aggregatorType, uint8 decimals
- **Constant**: false
- **Payable**: false

### getAssetForEth
- **Signature**: `getAssetForEth(address assetAddress, uint256 ethIn)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getAssetToEthRate
- **Signature**: `getAssetToEthRate(address assetAddress)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getEthForAsset
- **Signature**: `getEthForAsset(address assetAddress, uint256 amount)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### safeTracker
- **Signature**: `safeTracker()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false


## Events (0)


## State Variables (0)

