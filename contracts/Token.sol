pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Token is ERC20, Ownable {
    uint8 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 5 ether;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Function to mint tokens
    // Only the owner of the contract (the one who deployed it) can call this function
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
}