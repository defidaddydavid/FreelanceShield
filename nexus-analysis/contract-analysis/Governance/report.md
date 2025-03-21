# Governance Contract Analysis

## Overview
- **Address**: 0xcafeafa258be9acb7c0de989be21a8e9583fba65
- **Category**: Governance
- **Description**: DAO voting

## Contract Patterns


## Functions (38)
### allDelegation
- **Signature**: `allDelegation(uint256 )`
- **Visibility**: view
- **Returns**: address follower, address leader, uint256 lastUpd
- **Constant**: true
- **Payable**: false

### allowedToCatgorize
- **Signature**: `allowedToCatgorize()`
- **Visibility**: view
- **Returns**: uint256 roleId
- **Constant**: true
- **Payable**: false

### allowedToCreateProposal
- **Signature**: `allowedToCreateProposal(uint256 category)`
- **Visibility**: view
- **Returns**: bool check
- **Constant**: true
- **Payable**: false

### canCloseProposal
- **Signature**: `canCloseProposal(uint256 _proposalId)`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### categorizeProposal
- **Signature**: `categorizeProposal(uint256 _proposalId, uint256 _categoryId, uint256 _incentive)`
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
- **Signature**: `changeMasterAddress(address _masterAddress)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### claimReward
- **Signature**: `claimReward(address _memberAddress, uint256 _maxRecords)`
- **Visibility**: nonpayable
- **Returns**: uint256 pendingDAppReward
- **Constant**: false
- **Payable**: false

### closeProposal
- **Signature**: `closeProposal(uint256 _proposalId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### createProposal
- **Signature**: `createProposal(string _proposalTitle, string _proposalSD, string _proposalDescHash, uint256 _categoryId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### createProposalwithSolution
- **Signature**: `createProposalwithSolution(string _proposalTitle, string _proposalSD, string _proposalDescHash, uint256 _categoryId, string _solutionHash, bytes _action)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### followerDelegation
- **Signature**: `followerDelegation(address )`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### getFollowers
- **Signature**: `getFollowers(address _add)`
- **Visibility**: view
- **Returns**: uint256[] 
- **Constant**: true
- **Payable**: false

### getPendingReward
- **Signature**: `getPendingReward(address _memberAddress)`
- **Visibility**: view
- **Returns**: uint256 pendingDAppReward
- **Constant**: true
- **Payable**: false

### getProposalLength
- **Signature**: `getProposalLength()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### getSolutionAction
- **Signature**: `getSolutionAction(uint256 _proposalId, uint256 _solution)`
- **Visibility**: view
- **Returns**: uint256 , bytes 
- **Constant**: true
- **Payable**: false

### getUintParameters
- **Signature**: `getUintParameters(bytes8 code)`
- **Visibility**: view
- **Returns**: bytes8 codeVal, uint256 val
- **Constant**: true
- **Payable**: false

### isOpenForDelegation
- **Signature**: `isOpenForDelegation(address )`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: true
- **Payable**: false

### lastRewardClaimed
- **Signature**: `lastRewardClaimed(address )`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### memberProposalVote
- **Signature**: `memberProposalVote(address , uint256 )`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### ms
- **Signature**: `ms()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: true
- **Payable**: false

### nxMasterAddress
- **Signature**: `nxMasterAddress()`
- **Visibility**: view
- **Returns**: address 
- **Constant**: true
- **Payable**: false

### proposal
- **Signature**: `proposal(uint256 _proposalId)`
- **Visibility**: view
- **Returns**: uint256 proposalId, uint256 category, uint256 status, uint256 finalVerdict, uint256 totalReward
- **Constant**: true
- **Payable**: false

### proposalActionStatus
- **Signature**: `proposalActionStatus(uint256 )`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### proposalDetails
- **Signature**: `proposalDetails(uint256 _proposalId)`
- **Visibility**: view
- **Returns**: uint256 , uint256 , uint256 
- **Constant**: true
- **Payable**: false

### proposalRejectedByAB
- **Signature**: `proposalRejectedByAB(uint256 , address )`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: true
- **Payable**: false

### proposalVoteTally
- **Signature**: `proposalVoteTally(uint256 )`
- **Visibility**: view
- **Returns**: uint256 voters
- **Constant**: true
- **Payable**: false

### rejectAction
- **Signature**: `rejectAction(uint256 _proposalId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### rewardClaimed
- **Signature**: `rewardClaimed(uint256 , address )`
- **Visibility**: view
- **Returns**: bool 
- **Constant**: true
- **Payable**: false

### submitProposalWithSolution
- **Signature**: `submitProposalWithSolution(uint256 _proposalId, string _solutionHash, bytes _action)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### submitVote
- **Signature**: `submitVote(uint256 _proposalId, uint256 _solutionChosen)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### submitVoteWithoutDelegations
- **Signature**: `submitVoteWithoutDelegations(uint256 _proposalId, uint256 _solutionChosen)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### tokenHoldingTime
- **Signature**: `tokenHoldingTime()`
- **Visibility**: view
- **Returns**: uint256 
- **Constant**: true
- **Payable**: false

### triggerAction
- **Signature**: `triggerAction(uint256 _proposalId)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### unDelegate
- **Signature**: `unDelegate()`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateProposal
- **Signature**: `updateProposal(uint256 _proposalId, string _proposalTitle, string _proposalSD, string _proposalDescHash)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### updateUintParameters
- **Signature**: `updateUintParameters(bytes8 code, uint256 val)`
- **Visibility**: nonpayable
- **Returns**: void
- **Constant**: false
- **Payable**: false

### voteTallyData
- **Signature**: `voteTallyData(uint256 _proposalId, uint256 _solution)`
- **Visibility**: view
- **Returns**: uint256 , uint256 , uint256 
- **Constant**: true
- **Payable**: false


## Events (11)
### ActionFailed
- **Signature**: `ActionFailed(uint256  proposalId)`
- **Anonymous**: false

### ActionRejected
- **Signature**: `ActionRejected(uint256 indexed proposalId, address  rejectedBy)`
- **Anonymous**: false

### ActionSuccess
- **Signature**: `ActionSuccess(uint256  proposalId)`
- **Anonymous**: false

### CloseProposalOnTime
- **Signature**: `CloseProposalOnTime(uint256 indexed proposalId, uint256  time)`
- **Anonymous**: false

### Proposal
- **Signature**: `Proposal(address indexed proposalOwner, uint256 indexed proposalId, uint256  dateAdd, string  proposalTitle, string  proposalSD, string  proposalDescHash)`
- **Anonymous**: false

### ProposalAccepted
- **Signature**: `ProposalAccepted(uint256  proposalId)`
- **Anonymous**: false

### ProposalCategorized
- **Signature**: `ProposalCategorized(uint256 indexed proposalId, address indexed categorizedBy, uint256  categoryId)`
- **Anonymous**: false

### RewardClaimed
- **Signature**: `RewardClaimed(address indexed member, uint256  gbtReward)`
- **Anonymous**: false

### Solution
- **Signature**: `Solution(uint256 indexed proposalId, address indexed solutionOwner, uint256 indexed solutionId, string  solutionDescHash, uint256  dateAdd)`
- **Anonymous**: false

### Vote
- **Signature**: `Vote(address indexed from, uint256 indexed proposalId, uint256 indexed voteId, uint256  dateAdd, uint256  solutionChosen)`
- **Anonymous**: false

### VoteCast
- **Signature**: `VoteCast(uint256  proposalId)`
- **Anonymous**: false


## State Variables (0)

