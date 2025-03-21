{{
  "language": "Solidity",
  "sources": {
    "@openzeppelin/contracts-v4/proxy/Proxy.sol": {
      "content": "// SPDX-License-Identifier: MIT\n// OpenZeppelin Contracts (last updated v4.6.0) (proxy/Proxy.sol)\n\npragma solidity ^0.8.0;\n\n/**\n * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM\n * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to\n * be specified by overriding the virtual {_implementation} function.\n *\n * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a\n * different contract through the {_delegate} function.\n *\n * The success and return data of the delegated call will be returned back to the caller of the proxy.\n */\nabstract contract Proxy {\n    /**\n     * @dev Delegates the current call to `implementation`.\n     *\n     * This function does not return to its internal call site, it will return directly to the external caller.\n     */\n    function _delegate(address implementation) internal virtual {\n        assembly {\n            // Copy msg.data. We take full control of memory in this inline assembly\n            // block because it will not return to Solidity code. We overwrite the\n            // Solidity scratch pad at memory position 0.\n            calldatacopy(0, 0, calldatasize())\n\n            // Call the implementation.\n            // out and outsize are 0 because we don't know the size yet.\n            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)\n\n            // Copy the returned data.\n            returndatacopy(0, 0, returndatasize())\n\n            switch result\n            // delegatecall returns 0 on error.\n            case 0 {\n                revert(0, returndatasize())\n            }\n            default {\n                return(0, returndatasize())\n            }\n        }\n    }\n\n    /**\n     * @dev This is a virtual function that should be overridden so it returns the address to which the fallback function\n     * and {_fallback} should delegate.\n     */\n    function _implementation() internal view virtual returns (address);\n\n    /**\n     * @dev Delegates the current call to the address returned by `_implementation()`.\n     *\n     * This function does not return to its internal call site, it will return directly to the external caller.\n     */\n    function _fallback() internal virtual {\n        _beforeFallback();\n        _delegate(_implementation());\n    }\n\n    /**\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other\n     * function in the contract matches the call data.\n     */\n    fallback() external payable virtual {\n        _fallback();\n    }\n\n    /**\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data\n     * is empty.\n     */\n    receive() external payable virtual {\n        _fallback();\n    }\n\n    /**\n     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`\n     * call, or as part of the Solidity `fallback` or `receive` functions.\n     *\n     * If overridden should call `super._beforeFallback()`.\n     */\n    function _beforeFallback() internal virtual {}\n}\n"
    },
    "contracts/interfaces/IStakingPoolBeacon.sol": {
      "content": "// SPDX-License-Identifier: MIT\n\npragma solidity >=0.5.0;\n\n/**\n * @dev This is the interface that {BeaconProxy} expects of its beacon.\n */\ninterface IStakingPoolBeacon {\n  /**\n   * @dev Must return an address that can be used as a delegate call target.\n   *\n   * {BeaconProxy} will check that this address is a contract.\n   */\n  function stakingPoolImplementation() external view returns (address);\n}\n"
    },
    "contracts/interfaces/IStakingPoolFactory.sol": {
      "content": "// SPDX-License-Identifier: GPL-3.0-only\n\npragma solidity >=0.5.0;\n\ninterface IStakingPoolFactory {\n\n  function stakingPoolCount() external view returns (uint);\n\n  function beacon() external view returns (address);\n\n  function create(address beacon) external returns (uint poolId, address stakingPoolAddress);\n\n  event StakingPoolCreated(uint indexed poolId, address indexed stakingPoolAddress);\n}\n"
    },
    "contracts/modules/staking/MinimalBeaconProxy.sol": {
      "content": "// SPDX-License-Identifier: GPL-3.0-only\n\npragma solidity ^0.8.18;\n\nimport \"@openzeppelin/contracts-v4/proxy/Proxy.sol\";\nimport \"../../interfaces/IStakingPoolBeacon.sol\";\nimport \"../../interfaces/IStakingPoolFactory.sol\";\n\n/**\n * @dev This contract implements a proxy that gets the implementation address for each call from a {UpgradeableBeacon}.\n *\n * The beacon address is stored as an immutable field.\n *\n */\ncontract MinimalBeaconProxy is Proxy {\n\n  /**\n   * @dev The beacon address.\n   */\n  address immutable public beacon;\n\n  /**\n   * @dev Initializes the proxy with `beacon`.\n   *\n   */\n  constructor() {\n    beacon = IStakingPoolFactory(msg.sender).beacon();\n  }\n\n  /**\n   * @dev Returns the current beacon address.\n   */\n  function _beacon() internal view virtual returns (address) {\n    return beacon;\n  }\n\n  /**\n   * @dev Returns the current implementation address of the associated beacon.\n   */\n  function _implementation() internal view virtual override returns (address) {\n    return IStakingPoolBeacon(beacon).stakingPoolImplementation();\n  }\n}\n"
    },
    "contracts/modules/staking/StakingPoolFactory.sol": {
      "content": "// SPDX-License-Identifier: AGPL-3.0-only\n\npragma solidity ^0.8.18;\n\nimport \"../../interfaces/IStakingPoolFactory.sol\";\nimport \"./MinimalBeaconProxy.sol\";\n\ncontract StakingPoolFactory is IStakingPoolFactory {\n\n  address public operator;\n  uint96 internal _stakingPoolCount;\n\n  // temporary beacon address storage to avoid constructor arguments in the proxy\n  address public beacon;\n\n  constructor(address _operator) {\n    operator = _operator;\n  }\n\n  function changeOperator(address newOperator) public {\n    require(msg.sender == operator, \"StakingPoolFactory: Not operator\");\n    require(newOperator != address(0), \"StakingPoolFactory: Invalid operator\");\n    operator = newOperator;\n  }\n\n  function stakingPoolCount() external view returns (uint) {\n    return _stakingPoolCount;\n  }\n\n  function create(address _beacon) external returns (uint poolId, address stakingPoolAddress) {\n\n    require(msg.sender == operator, \"StakingPoolFactory: Not operator\");\n\n    beacon = _beacon;\n    poolId = ++_stakingPoolCount;\n\n    stakingPoolAddress = address(\n      new MinimalBeaconProxy{salt : bytes32(poolId)}()\n    );\n\n    require(\n      stakingPoolAddress != address(0),\n      \"StakingPoolFactory: Failed to create staking pool\"\n    );\n\n    emit StakingPoolCreated(poolId, stakingPoolAddress);\n  }\n}\n"
    }
  },
  "settings": {
    "optimizer": {
      "enabled": true,
      "runs": 200
    },
    "outputSelection": {
      "*": {
        "*": [
          "evm.bytecode",
          "evm.deployedBytecode",
          "devdoc",
          "userdoc",
          "metadata",
          "abi"
        ]
      }
    },
    "libraries": {}
  }
}}