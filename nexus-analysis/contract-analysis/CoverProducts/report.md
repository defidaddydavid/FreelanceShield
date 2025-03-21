# CoverProducts Contract Analysis

## Overview
- **Address**: 0xcafea02300a2fa591f0b741e4643982883dfeee3
- **Category**: Insurance
- **Description**: Insurance product types

## Contract Patterns


## Functions (31)
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

### getAllowedPools
- **Signature**: `getAllowedPools(uint256 productId)`
- **Visibility**: view
- **Returns**: uint256[] _allowedPools
- **Constant**: false
- **Payable**: false

### getAllowedPoolsCount
- **Signature**: `getAllowedPoolsCount(uint256 productId)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getCapacityReductionRatios
- **Signature**: `getCapacityReductionRatios(uint256[] productIds)`
- **Visibility**: view
- **Returns**: uint256[] capacityReductionRatios
- **Constant**: false
- **Payable**: false

### getInitialPrices
- **Signature**: `getInitialPrices(uint256[] productIds)`
- **Visibility**: view
- **Returns**: uint256[] initialPrices
- **Constant**: false
- **Payable**: false

### getLatestProductMetadata
- **Signature**: `getLatestProductMetadata(uint256 productId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getLatestProductTypeMetadata
- **Signature**: `getLatestProductTypeMetadata(uint256 productTypeId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getMinPrices
- **Signature**: `getMinPrices(uint256[] productIds)`
- **Visibility**: view
- **Returns**: uint256[] minPrices
- **Constant**: false
- **Payable**: false

### getProduct
- **Signature**: `getProduct(uint256 productId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getProductCount
- **Signature**: `getProductCount()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getProductMetadata
- **Signature**: `getProductMetadata(uint256 productId)`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### getProductName
- **Signature**: `getProductName(uint256 productId)`
- **Visibility**: view
- **Returns**: string 
- **Constant**: false
- **Payable**: false

### getProductType
- **Signature**: `getProductType(uint256 productTypeId)`
- **Visibility**: view
- **Returns**: tuple 
- **Constant**: false
- **Payable**: false

### getProductTypeCount
- **Signature**: `getProductTypeCount()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### getProductTypeMetadata
- **Signature**: `getProductTypeMetadata(uint256 productTypeId)`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### getProductTypeName
- **Signature**: `getProductTypeName(uint256 productTypeId)`
- **Visibility**: view
- **Returns**: string 
- **Constant**: false
- **Payable**: false

### getProductTypes
- **Signature**: `getProductTypes()`
- **Visibility**: view
- **Returns**: tuple[] 
- **Constant**: false
- **Payable**: false

### getProductWithType
- **Signature**: `getProductWithType(uint256 productId)`
- **Visibility**: view
- **Returns**: tuple product, tuple productType
- **Constant**: false
- **Payable**: false

### getProducts
- **Signature**: `getProducts()`
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

### isPoolAllowed
- **Signature**: `isPoolAllowed(uint256 productId, uint256 poolId)`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### master
- **Signature**: `master()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### migrateCoverProducts
- **Signature**: `migrateCoverProducts()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### multicall
- **Signature**: `multicall(bytes[] data)`
- **Visibility**: nonpayable
- **Returns**: bytes[] results
- **Constant**: false
- **Payable**: false

### prepareStakingProductsParams
- **Signature**: `prepareStakingProductsParams(tuple[] params)`
- **Visibility**: view
- **Returns**: tuple[] validatedParams
- **Constant**: false
- **Payable**: false

### requirePoolIsAllowed
- **Signature**: `requirePoolIsAllowed(uint256[] productIds, uint256 poolId)`
- **Visibility**: view
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setProductTypes
- **Signature**: `setProductTypes(tuple[] productTypeParams)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setProductTypesMetadata
- **Signature**: `setProductTypesMetadata(uint256[] productTypeIds, string[] ipfsMetadata)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setProducts
- **Signature**: `setProducts(tuple[] productParams)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setProductsMetadata
- **Signature**: `setProductsMetadata(uint256[] productIds, string[] ipfsMetadata)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (2)
### ProductSet
- **Signature**: `ProductSet(uint256  id)`
- **Anonymous**: false

### ProductTypeSet
- **Signature**: `ProductTypeSet(uint256  id)`
- **Anonymous**: false


## State Variables (0)

