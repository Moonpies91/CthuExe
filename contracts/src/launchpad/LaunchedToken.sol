// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title LaunchedToken
 * @notice ERC-20 token created through the Cultist Launchpad
 * @dev Fixed 1B supply with predetermined distribution:
 *      - 800M (80%) for bonding curve sale
 *      - 150M (15%) for graduation liquidity
 *      - 50M (5%) for creator allocation
 */
contract LaunchedToken is ERC20 {
    // ============ Constants ============

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant BONDING_CURVE_SUPPLY = 800_000_000 * 10**18;  // 80%
    uint256 public constant LIQUIDITY_SUPPLY = 150_000_000 * 10**18;      // 15%
    uint256 public constant CREATOR_SUPPLY = 50_000_000 * 10**18;         // 5%

    // ============ State Variables ============

    address public immutable launchpad;
    address public immutable creator;
    string public imageUri;

    // ============ Constructor ============

    /**
     * @notice Deploy a new launched token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _imageUri IPFS or HTTP URI for token image
     * @param _creator Address of the token creator
     * @param _launchpad Address of the launchpad contract
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _imageUri,
        address _creator,
        address _launchpad
    ) ERC20(_name, _symbol) {
        require(_creator != address(0), "LaunchedToken: Invalid creator");
        require(_launchpad != address(0), "LaunchedToken: Invalid launchpad");

        creator = _creator;
        launchpad = _launchpad;
        imageUri = _imageUri;

        // Mint bonding curve supply to launchpad
        _mint(_launchpad, BONDING_CURVE_SUPPLY);

        // Mint liquidity supply to launchpad (held until graduation)
        _mint(_launchpad, LIQUIDITY_SUPPLY);

        // Mint creator supply to creator
        _mint(_creator, CREATOR_SUPPLY);
    }

    /**
     * @notice Returns token metadata
     * @return name_ Token name
     * @return symbol_ Token symbol
     * @return imageUri_ Token image URI
     * @return creator_ Token creator address
     * @return totalSupply_ Total supply
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        string memory imageUri_,
        address creator_,
        uint256 totalSupply_
    ) {
        return (name(), symbol(), imageUri, creator, totalSupply());
    }
}
