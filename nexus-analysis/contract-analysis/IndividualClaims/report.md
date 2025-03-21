# IndividualClaims Contract Analysis

## Overview
- **Address**: 0xcafea1079707cdabdb1f31e28692545b44fb23db
- **Category**: Claims
- **Description**: Claims processing

## Contract Patterns
- Uses ERC721
- Uses ERC20
- Uses Oracles
- Uses Math

## Functions (16)
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

### claims
- **Signature**: `claims(uint256 )`
- **Visibility**: view
- **Returns**: uint80 assessmentId, uint32 coverId, uint16 segmentId, uint96 amount, uint8 coverAsset, bool payoutRedeemed
- **Constant**: false
- **Payable**: false

### config
- **Signature**: `config()`
- **Visibility**: view
- **Returns**: uint8 payoutRedemptionPeriodInDays, uint16 minAssessmentDepositRatio, uint16 maxRewardInNXMWad, uint16 rewardRatio
- **Constant**: false
- **Payable**: false

### coverNFT
- **Signature**: `coverNFT()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### getAssessmentDepositAndReward
- **Signature**: `getAssessmentDepositAndReward(uint256 requestedAmount, uint256 segmentPeriod, uint256 coverAsset)`
- **Visibility**: view
- **Returns**: uint256 , uint256 
- **Constant**: false
- **Payable**: false

### getClaimsCount
- **Signature**: `getClaimsCount()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getClaimsToDisplay
- **Signature**: `getClaimsToDisplay(uint256[] ids)`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### internalContracts
- **Signature**: `internalContracts(uint256 )`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### lastClaimSubmissionOnCover
- **Signature**: `lastClaimSubmissionOnCover(uint256 )`
- **Visibility**: view
- **Returns**: uint80 claimId, bool exists
- **Constant**: false
- **Payable**: false

### master
- **Signature**: `master()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### nxm
- **Signature**: `nxm()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### redeemClaimPayout
- **Signature**: `redeemClaimPayout(uint104 claimId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### submitClaim
- **Signature**: `submitClaim(uint32 coverId, uint16 segmentId, uint96 requestedAmount, string ipfsMetadata)`
- **Visibility**: payable
- **Returns**: tuple claim
- **Constant**: false
- **Payable**: false

### submitClaimFor
- **Signature**: `submitClaimFor(uint32 coverId, uint16 segmentId, uint96 requestedAmount, string ipfsMetadata, address owner)`
- **Visibility**: payable
- **Returns**: tuple claim
- **Constant**: false
- **Payable**: false

### updateUintParameters
- **Signature**: `updateUintParameters(uint8[] paramNames, uint256[] values)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (3)
### ClaimPayoutRedeemed
- **Signature**: `ClaimPayoutRedeemed(address indexed user, uint256  amount, uint256  claimId, uint256  coverId)`
- **Anonymous**: false

### ClaimSubmitted
- **Signature**: `ClaimSubmitted(address indexed user, uint256  claimId, uint256 indexed coverId, uint256  productId)`
- **Anonymous**: false

### MetadataSubmitted
- **Signature**: `MetadataSubmitted(uint256 indexed claimId, string  ipfsMetadata)`
- **Anonymous**: false


## State Variables (1)
- `INXMMaster public master;`
