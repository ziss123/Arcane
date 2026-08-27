// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleSwap {
    address public owner;

    mapping(address => mapping(address => uint256)) public rates;

    event Swapped(address indexed tokenIn, address indexed tokenOut, address indexed user, uint256 amountIn, uint256 amountOut);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setRate(address tokenIn, address tokenOut, uint256 rate) external onlyOwner {
        rates[tokenIn][tokenOut] = rate;
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        uint256 rate = rates[tokenIn][tokenOut];
        require(rate > 0, "Route not supported");
        return (amountIn * rate) / 1e6;
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn) external {
        require(amountIn > 0, "Amount must be > 0");
        uint256 amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(
            IERC20(tokenOut).balanceOf(address(this)) >= amountOut,
            "Insufficient liquidity"
        );
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        emit Swapped(tokenIn, tokenOut, msg.sender, amountIn, amountOut);
    }

    function addLiquidity(address token, uint256 amount) external onlyOwner {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
}