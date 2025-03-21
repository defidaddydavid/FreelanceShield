# Pool Contract Analysis

## Overview
- **Address**: 0xcafeaf6eA90CB931ae43a8Cf4B25a73a24cF6158
- **Category**: Risk
- **Description**: Main risk pool contract

## Contract Patterns
- Uses Proxy
- Uses SafeERC20
- Uses ReentrancyGuard
- Uses ERC20
- Uses Oracles
- Uses Math

## Functions (35)
### ETH
- **Signature**: `ETH()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### MCR_RATIO_DECIMALS
- **Signature**: `MCR_RATIO_DECIMALS()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### addAsset
- **Signature**: `addAsset(address assetAddress, bool isCoverAsset, uint256 _min, uint256 _max, uint256 _maxSlippageRatio)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### assetInSwapOperator
- **Signature**: `assetInSwapOperator()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### assets
- **Signature**: `assets(uint256 )`
- **Visibility**: view
- **Returns**: address assetAddress, bool isCoverAsset, bool isAbandoned
- **Constant**: false
- **Payable**: false

### assetsInSwapOperatorBitmap
- **Signature**: `assetsInSwapOperatorBitmap()`
- **Visibility**: view
- **Returns**: uint32 
- **Constant**: false
- **Payable**: false

### calculateMCRRatio
- **Signature**: `calculateMCRRatio(uint256 totalAssetValue, uint256 mcrEth)`
- **Visibility**: pure
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

### getAsset
- **Signature**: `getAsset(uint256 assetId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getAssetId
- **Signature**: `getAssetId(address assetAddress)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getAssetSwapDetails
- **Signature**: `getAssetSwapDetails(address assetAddress)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getAssets
- **Signature**: `getAssets()`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### getInternalTokenPriceInAsset
- **Signature**: `getInternalTokenPriceInAsset(uint256 assetId)`
- **Visibility**: view
- **Returns**: uint256 tokenPrice
- **Constant**: false
- **Payable**: false

### getInternalTokenPriceInAssetAndUpdateTwap
- **Signature**: `getInternalTokenPriceInAssetAndUpdateTwap(uint256 assetId)`
- **Visibility**: nonpayable
- **Returns**: uint256 tokenPrice
- **Constant**: false
- **Payable**: false

### getMCRRatio
- **Signature**: `getMCRRatio()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getPoolValueInEth
- **Signature**: `getPoolValueInEth()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getTokenPrice
- **Signature**: `getTokenPrice()`
- **Visibility**: view
- **Returns**: uint256 tokenPrice
- **Constant**: false
- **Payable**: false

### internalContracts
- **Signature**: `internalContracts(uint256 )`
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

### nxmToken
- **Signature**: `nxmToken()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### priceFeedOracle
- **Signature**: `priceFeedOracle()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### sendEth
- **Signature**: `sendEth(address member, uint256 amount)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### sendPayout
- **Signature**: `sendPayout(uint256 assetId, address payoutAddress, uint256 amount, uint256 ethDepositAmount)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setAssetDetails
- **Signature**: `setAssetDetails(uint256 assetId, bool isCoverAsset, bool isAbandoned)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setSwapAssetAmount
- **Signature**: `setSwapAssetAmount(address assetAddress, uint256 value)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setSwapDetails
- **Signature**: `setSwapDetails(address assetAddress, uint256 _min, uint256 _max, uint256 _maxSlippageRatio)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setSwapDetailsLastSwapTime
- **Signature**: `setSwapDetailsLastSwapTime(address assetAddress, uint32 lastSwapTime)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### swapDetails
- **Signature**: `swapDetails(address )`
- **Visibility**: view
- **Returns**: uint104 minAmount, uint104 maxAmount, uint32 lastSwapTime, uint16 maxSlippageRatio
- **Constant**: false
- **Payable**: false

### swapOperator
- **Signature**: `swapOperator()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### transferAsset
- **Signature**: `transferAsset(address assetAddress, address destination, uint256 amount)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### transferAssetToSwapOperator
- **Signature**: `transferAssetToSwapOperator(address assetAddress, uint256 amount)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateAddressParameters
- **Signature**: `updateAddressParameters(bytes8 code, address value)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateUintParameters
- **Signature**: `updateUintParameters(bytes8 , uint256 )`
- **Visibility**: view
- **Returns**: void
- **Constant**: false
- **Payable**: false

### upgradeCapitalPool
- **Signature**: `upgradeCapitalPool(address newPoolAddress)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (2)
### DepositReturned
- **Signature**: `DepositReturned(address indexed to, uint256  amount)`
- **Anonymous**: false

### Payout
- **Signature**: `Payout(address indexed to, address indexed assetAddress, uint256  amount)`
- **Anonymous**: false


## State Variables (7)
- `uint256 private _status;`
- `INXMMaster public master;`
- `Asset[] public assets;`
- `address public swapOperator;`
- `uint32 public assetsInSwapOperatorBitmap;`
- `uint public assetInSwapOperator;`
- `constant public ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;`
