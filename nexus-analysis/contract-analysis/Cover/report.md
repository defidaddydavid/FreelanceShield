# Cover Contract Analysis

## Overview
- **Address**: 0xcafea570e7857383e0b88f43c0dcaa3640c29781
- **Category**: Insurance
- **Description**: Core contract for policy management

## Contract Patterns
- Uses Proxy
- Uses SafeERC20
- Uses ReentrancyGuard
- Uses ERC721
- Uses ERC20
- Uses Oracles
- Uses Math

## Functions (32)
### DEFAULT_MIN_PRICE_RATIO
- **Signature**: `DEFAULT_MIN_PRICE_RATIO()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### MAX_COMMISSION_RATIO
- **Signature**: `MAX_COMMISSION_RATIO()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### NXM_PER_ALLOCATION_UNIT
- **Signature**: `NXM_PER_ALLOCATION_UNIT()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### activeCover
- **Signature**: `activeCover(uint256 )`
- **Visibility**: view
- **Returns**: uint192 totalActiveCoverInAsset, uint64 lastBucketUpdateId
- **Constant**: false
- **Payable**: false

### burnStake
- **Signature**: `burnStake(uint256 coverId, uint256 segmentId, uint256 payoutAmountInAsset)`
- **Visibility**: nonpayable
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### buyCover
- **Signature**: `buyCover(tuple params, tuple[] poolAllocationRequests)`
- **Visibility**: payable
- **Returns**: uint256 coverId
- **Constant**: false
- **Payable**: false

### changeCoverNFTDescriptor
- **Signature**: `changeCoverNFTDescriptor(address _coverNFTDescriptor)`
- **Visibility**: nonpayable
- **Returns**: void
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

### changeStakingNFTDescriptor
- **Signature**: `changeStakingNFTDescriptor(address _stakingNFTDescriptor)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### coverData
- **Signature**: `coverData(uint256 coverId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### coverDataCount
- **Signature**: `coverDataCount()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### coverNFT
- **Signature**: `coverNFT()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### coverSegmentAllocations
- **Signature**: `coverSegmentAllocations(uint256 , uint256 , uint256 )`
- **Visibility**: view
- **Returns**: uint40 poolId, uint96 coverAmountInNXM, uint96 premiumInNXM, uint24 allocationId
- **Constant**: false
- **Payable**: false

### coverSegmentWithRemainingAmount
- **Signature**: `coverSegmentWithRemainingAmount(uint256 coverId, uint256 segmentId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### coverSegments
- **Signature**: `coverSegments(uint256 coverId)`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### coverSegmentsCount
- **Signature**: `coverSegmentsCount(uint256 coverId)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### expireCover
- **Signature**: `expireCover(uint256 coverId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### getDefaultMinPriceRatio
- **Signature**: `getDefaultMinPriceRatio()`
- **Visibility**: pure
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getGlobalCapacityAndPriceRatios
- **Signature**: `getGlobalCapacityAndPriceRatios()`
- **Visibility**: pure
- **Returns**: uint256 _globalCapacityRatio, uint256 _defaultMinPriceRatio
- **Constant**: false
- **Payable**: false

### getGlobalCapacityRatio
- **Signature**: `getGlobalCapacityRatio()`
- **Visibility**: pure
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getGlobalRewardsRatio
- **Signature**: `getGlobalRewardsRatio()`
- **Visibility**: pure
- **Returns**: uint256 
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

### multicall
- **Signature**: `multicall(bytes[] data)`
- **Visibility**: nonpayable
- **Returns**: bytes[] results
- **Constant**: false
- **Payable**: false

### recalculateActiveCoverInAsset
- **Signature**: `recalculateActiveCoverInAsset(uint256 coverAsset)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### stakingNFT
- **Signature**: `stakingNFT()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### stakingPool
- **Signature**: `stakingPool(uint256 poolId)`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### stakingPoolFactory
- **Signature**: `stakingPoolFactory()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### stakingPoolImplementation
- **Signature**: `stakingPoolImplementation()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### totalActiveCoverInAsset
- **Signature**: `totalActiveCoverInAsset(uint256 assetId)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### updateTotalActiveCoverAmount
- **Signature**: `updateTotalActiveCoverAmount(uint256 coverAsset)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (1)
### CoverEdited
- **Signature**: `CoverEdited(uint256 indexed coverId, uint256 indexed productId, uint256 indexed segmentId, address  buyer, string  ipfsMetadata)`
- **Anonymous**: false


## State Variables (4)
- `uint256 private _status;`
- `INXMMaster public master;`
- `Product[] private _unused_products;`
- `ProductType[] private _unused_productTypes;`
