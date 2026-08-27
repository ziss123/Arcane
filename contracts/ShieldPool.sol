// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract ShieldPool {
    // token => user => shielded balance
    mapping(address => mapping(address => uint256)) private shieldedBalances;
    mapping(address => uint256) public totalShielded;
    mapping(address => uint256) public anonymitySet;

    event Shielded(address indexed token, address indexed user, uint256 amount);
    event Unshielded(address indexed token, address indexed user, address indexed recipient, uint256 amount);

    function shield(address token, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            IERC20(token).allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );

        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "Transfer failed");

        shieldedBalances[token][msg.sender] += amount;
        totalShielded[token] += amount;
        anonymitySet[token] += 1;

        emit Shielded(token, msg.sender, amount);
    }

    function unshield(address token, uint256 amount, address recipient) external {
        require(amount > 0, "Amount must be > 0");
        require(shieldedBalances[token][msg.sender] >= amount, "Insufficient shielded balance");
        require(recipient != address(0), "Invalid recipient");

        shieldedBalances[token][msg.sender] -= amount;
        totalShielded[token] -= amount;
        if (anonymitySet[token] > 0) anonymitySet[token] -= 1;

        bool ok = IERC20(token).transfer(recipient, amount);
        require(ok, "Transfer failed");

        emit Unshielded(token, msg.sender, recipient, amount);
    }

    function getShieldedBalance(address token, address user) external view returns (uint256) {
        return shieldedBalances[token][user];
    }

    function getAnonymitySet(address token) external view returns (uint256) {
        return anonymitySet[token];
    }
}