// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ICthuFactory.sol";
import "../interfaces/ICthuPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IWMONAD.sol";
import "../libraries/CthuLibrary.sol";
import "../libraries/TransferHelper.sol";

/**
 * @title CthuRouter
 * @notice Router contract for CthuSwap DEX operations
 * @dev Fork of UniswapV2Router02 adapted for Monad
 */
contract CthuRouter {
    address public immutable factory;
    address public immutable WMONAD;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "CthuRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WMONAD) {
        factory = _factory;
        WMONAD = _WMONAD;
    }

    receive() external payable {
        assert(msg.sender == WMONAD); // only accept MONAD via fallback from the WMONAD contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // Create the pair if it doesn't exist yet
        if (ICthuFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            ICthuFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = CthuLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = CthuLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "CthuRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = CthuLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "CthuRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = CthuLibrary.pairFor(factory, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = ICthuPair(pair).mint(to);
    }

    function addLiquidityMONAD(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountMONADMin,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256 amountToken, uint256 amountMONAD, uint256 liquidity) {
        (amountToken, amountMONAD) = _addLiquidity(
            token,
            WMONAD,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountMONADMin
        );
        address pair = CthuLibrary.pairFor(factory, token, WMONAD);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWMONAD(WMONAD).deposit{value: amountMONAD}();
        assert(IWMONAD(WMONAD).transfer(pair, amountMONAD));
        liquidity = ICthuPair(pair).mint(to);
        // Refund dust MONAD, if any
        if (msg.value > amountMONAD) TransferHelper.safeTransferMONAD(msg.sender, msg.value - amountMONAD);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = CthuLibrary.pairFor(factory, tokenA, tokenB);
        ICthuPair(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = ICthuPair(pair).burn(to);
        (address token0,) = CthuLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "CthuRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "CthuRouter: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityMONAD(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountMONADMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountToken, uint256 amountMONAD) {
        (amountToken, amountMONAD) = removeLiquidity(
            token,
            WMONAD,
            liquidity,
            amountTokenMin,
            amountMONADMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, amountToken);
        IWMONAD(WMONAD).withdraw(amountMONAD);
        TransferHelper.safeTransferMONAD(to, amountMONAD);
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint256 amountA, uint256 amountB) {
        address pair = CthuLibrary.pairFor(factory, tokenA, tokenB);
        uint256 value = approveMax ? type(uint256).max : liquidity;
        ICthuPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }

    function removeLiquidityMONADWithPermit(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountMONADMin,
        address to,
        uint256 deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint256 amountToken, uint256 amountMONAD) {
        address pair = CthuLibrary.pairFor(factory, token, WMONAD);
        uint256 value = approveMax ? type(uint256).max : liquidity;
        ICthuPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountMONAD) = removeLiquidityMONAD(token, liquidity, amountTokenMin, amountMONADMin, to, deadline);
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityMONADSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountMONADMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountMONAD) {
        (, amountMONAD) = removeLiquidity(
            token,
            WMONAD,
            liquidity,
            amountTokenMin,
            amountMONADMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
        IWMONAD(WMONAD).withdraw(amountMONAD);
        TransferHelper.safeTransferMONAD(to, amountMONAD);
    }

    function removeLiquidityMONADWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountMONADMin,
        address to,
        uint256 deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint256 amountMONAD) {
        address pair = CthuLibrary.pairFor(factory, token, WMONAD);
        uint256 value = approveMax ? type(uint256).max : liquidity;
        ICthuPair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountMONAD = removeLiquidityMONADSupportingFeeOnTransferTokens(
            token, liquidity, amountTokenMin, amountMONADMin, to, deadline
        );
    }

    // **** SWAP ****
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = CthuLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? CthuLibrary.pairFor(factory, output, path[i + 2]) : _to;
            ICthuPair(CthuLibrary.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = CthuLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = CthuLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "CthuRouter: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapExactMONADForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WMONAD, "CthuRouter: INVALID_PATH");
        amounts = CthuLibrary.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWMONAD(WMONAD).deposit{value: amounts[0]}();
        assert(IWMONAD(WMONAD).transfer(CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }

    function swapTokensForExactMONAD(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline)
        external
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[path.length - 1] == WMONAD, "CthuRouter: INVALID_PATH");
        amounts = CthuLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "CthuRouter: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWMONAD(WMONAD).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferMONAD(to, amounts[amounts.length - 1]);
    }

    function swapExactTokensForMONAD(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[path.length - 1] == WMONAD, "CthuRouter: INVALID_PATH");
        amounts = CthuLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWMONAD(WMONAD).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferMONAD(to, amounts[amounts.length - 1]);
    }

    function swapMONADForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline)
        external
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WMONAD, "CthuRouter: INVALID_PATH");
        amounts = CthuLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "CthuRouter: EXCESSIVE_INPUT_AMOUNT");
        IWMONAD(WMONAD).deposit{value: amounts[0]}();
        assert(IWMONAD(WMONAD).transfer(CthuLibrary.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // Refund dust MONAD, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferMONAD(msg.sender, msg.value - amounts[0]);
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = CthuLibrary.sortTokens(input, output);
            ICthuPair pair = ICthuPair(CthuLibrary.pairFor(factory, input, output));
            uint256 amountInput;
            uint256 amountOutput;
            {
                (uint256 reserve0, uint256 reserve1,) = pair.getReserves();
                (uint256 reserveInput, uint256 reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
                amountInput = IERC20(input).balanceOf(address(pair)) - reserveInput;
                amountOutput = CthuLibrary.getAmountOut(amountInput, reserveInput, reserveOutput);
            }
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOutput) : (amountOutput, uint256(0));
            address to = i < path.length - 2 ? CthuLibrary.pairFor(factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) {
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amountIn
        );
        uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    function swapExactMONADForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) {
        require(path[0] == WMONAD, "CthuRouter: INVALID_PATH");
        uint256 amountIn = msg.value;
        IWMONAD(WMONAD).deposit{value: amountIn}();
        assert(IWMONAD(WMONAD).transfer(CthuLibrary.pairFor(factory, path[0], path[1]), amountIn));
        uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    function swapExactTokensForMONADSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) {
        require(path[path.length - 1] == WMONAD, "CthuRouter: INVALID_PATH");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, CthuLibrary.pairFor(factory, path[0], path[1]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint256 amountOut = IWMONAD(WMONAD).balanceOf(address(this));
        require(amountOut >= amountOutMin, "CthuRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWMONAD(WMONAD).withdraw(amountOut);
        TransferHelper.safeTransferMONAD(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        return CthuLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountOut)
    {
        return CthuLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        public
        pure
        returns (uint256 amountIn)
    {
        return CthuLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        return CthuLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, address[] memory path)
        public
        view
        returns (uint256[] memory amounts)
    {
        return CthuLibrary.getAmountsIn(factory, amountOut, path);
    }
}
