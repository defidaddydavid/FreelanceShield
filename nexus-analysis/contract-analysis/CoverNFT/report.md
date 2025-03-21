# CoverNFT Contract Analysis

## Overview
- **Address**: 0xcafeaCa76be547F14D0220482667B42D8E7Bc3eb
- **Category**: Insurance
- **Description**: NFT-based insurance tokenization

## Contract Patterns
- Uses ERC721

## Functions (20)
### approve
- **Signature**: `approve(address spender, uint256 id)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### balanceOf
- **Signature**: `balanceOf(address owner)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### changeNFTDescriptor
- **Signature**: `changeNFTDescriptor(address _newNFTDescriptor)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### changeOperator
- **Signature**: `changeOperator(address _newOperator)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### getApproved
- **Signature**: `getApproved(uint256 )`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### isApprovedForAll
- **Signature**: `isApprovedForAll(address , address )`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### isApprovedOrOwner
- **Signature**: `isApprovedOrOwner(address spender, uint256 tokenId)`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### mint
- **Signature**: `mint(address to)`
- **Visibility**: nonpayable
- **Returns**: uint256 id
- **Constant**: false
- **Payable**: false

### name
- **Signature**: `name()`
- **Visibility**: view
- **Returns**: string 
- **Constant**: false
- **Payable**: false

### nftDescriptor
- **Signature**: `nftDescriptor()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### operator
- **Signature**: `operator()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: false
- **Payable**: false

### ownerOf
- **Signature**: `ownerOf(uint256 id)`
- **Visibility**: view
- **Returns**: address owner
- **Constant**: false
- **Payable**: false

### safeTransferFrom
- **Signature**: `safeTransferFrom(address from, address to, uint256 id)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### safeTransferFrom
- **Signature**: `safeTransferFrom(address from, address to, uint256 id, bytes data)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### setApprovalForAll
- **Signature**: `setApprovalForAll(address spender, bool approved)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### supportsInterface
- **Signature**: `supportsInterface(bytes4 interfaceId)`
- **Visibility**: pure
- **Returns**: bool 
- **Constant**: false
- **Payable**: false

### symbol
- **Signature**: `symbol()`
- **Visibility**: view
- **Returns**: string 
- **Constant**: false
- **Payable**: false

### tokenURI
- **Signature**: `tokenURI(uint256 id)`
- **Visibility**: view
- **Returns**: string uri
- **Constant**: false
- **Payable**: false

### totalSupply
- **Signature**: `totalSupply()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: false
- **Payable**: false

### transferFrom
- **Signature**: `transferFrom(address from, address to, uint256 id)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false


## Events (3)
### Approval
- **Signature**: `Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)`
- **Anonymous**: false

### ApprovalForAll
- **Signature**: `ApprovalForAll(address indexed owner, address indexed operator, bool  approved)`
- **Anonymous**: false

### Transfer
- **Signature**: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`
- **Anonymous**: false


## State Variables (5)
- `string public name;`
- `string public symbol;`
- `uint96 internal _totalSupply;`
- `address public operator;`
- `address public nftDescriptor;`
