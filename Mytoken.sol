// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DepositTokenA is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("DepositTokenA", "DA") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

contract DepositTokenB is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("DepositTokenB", "DB") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

contract ConsortiumStablecoin is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("ConsortiumStablecoin", "CS") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

contract BankA is AccessControl {
    DepositTokenA public da;
    ConsortiumStablecoin public cs;
    address public consortium;
    uint256 public dailyDepositLimit = 50000 * 10**18; // $50,000 with 18 decimals
    uint256 public perTxLimit = 10000 * 10**18; // $10,000

    constructor(address _da, address _cs) {
        da = DepositTokenA(_da);
        cs = ConsortiumStablecoin(_cs);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setConsortium(address _consortium) public onlyRole(DEFAULT_ADMIN_ROLE) {
        consortium = _consortium;
    }

    function deposit(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= dailyDepositLimit, "Exceeds daily deposit limit");
        da.mint(to, amount);
        emit DepositMinted(to, amount);
    }

    function burnForConsortium(address from, uint256 amount) public {
        require(msg.sender == from || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        da.burnFrom(from, amount);
        Consortium(consortium).recordReserve(address(this), amount);
        Consortium(consortium).mintCS(from, amount);
        emit DepositBurned(from, amount);
    }

    function mintDepositForConsortium(address to, uint256 amount) public {
        require(msg.sender == consortium, "Only consortium");
        da.mint(to, amount);
        emit DepositMinted(to, amount);
    }

    function transferDeposit(address from, address to, uint256 amount) public {
        require(amount <= perTxLimit, "Exceeds per-tx limit");
        da.transferFrom(from, to, amount);
        emit DepositTransferred(from, to, amount);
    }

    event DepositMinted(address indexed to, uint256 amount);
    event DepositBurned(address indexed from, uint256 amount);
    event DepositTransferred(address indexed from, address indexed to, uint256 amount);
}

contract BankB is AccessControl {
    DepositTokenB public db;
    ConsortiumStablecoin public cs;
    address public consortium;
    uint256 public dailyDepositLimit = 50000 * 10**18; // $50,000
    uint256 public perTxLimit = 10000 * 10**18; // $10,000

    constructor(address _db, address _cs) {
        db = DepositTokenB(_db);
        cs = ConsortiumStablecoin(_cs);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setConsortium(address _consortium) public onlyRole(DEFAULT_ADMIN_ROLE) {
        consortium = _consortium;
    }

    function deposit(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= dailyDepositLimit, "Exceeds daily deposit limit");
        db.mint(to, amount);
        emit DepositMinted(to, amount);
    }

    function burnForConsortium(address from, uint256 amount) public {
        require(msg.sender == from || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        db.burnFrom(from, amount);
        Consortium(consortium).recordReserve(address(this), amount);
        Consortium(consortium).mintCS(from, amount);
        emit DepositBurned(from, amount);
    }

    function mintDepositForConsortium(address to, uint256 amount) public {
        require(msg.sender == consortium, "Only consortium");
        db.mint(to, amount);
        emit DepositMinted(to, amount);
    }

    function transferDeposit(address from, address to, uint256 amount) public {
        require(amount <= perTxLimit, "Exceeds per-tx limit");
        db.transferFrom(from, to, amount);
        emit DepositTransferred(from, to, amount);
    }

    event DepositMinted(address indexed to, uint256 amount);
    event DepositBurned(address indexed from, uint256 amount);
    event DepositTransferred(address indexed from, address indexed to, uint256 amount);
}

contract Consortium is AccessControl {
    ConsortiumStablecoin public cs;
    address public bankA;
    address public bankB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalReserve;
    mapping(address => uint256) public pendingForA;
    mapping(address => uint256) public pendingForB;
    uint256 public perTxCap = 10000 * 10**18; // $10,000

    constructor(address _cs, address _bankA, address _bankB) {
        cs = ConsortiumStablecoin(_cs);
        bankA = _bankA;
        bankB = _bankB;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function recordReserve(address bank, uint256 amount) public {
        require(msg.sender == bankA || msg.sender == bankB, "Not a bank");
        if (bank == bankA) {
            reserveA += amount;
        } else if (bank == bankB) {
            reserveB += amount;
        }
        totalReserve += amount;
    }

    function mintCS(address to, uint256 amount) public {
        if (msg.sender == bankA) {
            require(reserveA >= amount, "Not enough reserve A");
            reserveA -= amount;
        } else if (msg.sender == bankB) {
            require(reserveB >= amount, "Not enough reserve B");
            reserveB -= amount;
        } else {
            revert("Not a bank");
        }
        totalReserve -= amount;
        cs.mint(to, amount);
        emit ConsortiumMinted(to, amount);
    }

    function transferCS(address to, uint256 amount, address targetBank) public {
        require(amount <= perTxCap, "Exceeds per-tx cap");
        cs.burnFrom(msg.sender, amount);
        if (targetBank == bankA) {
            pendingForA[to] += amount;
        } else if (targetBank == bankB) {
            pendingForB[to] += amount;
        }
        emit ConsortiumBurned(msg.sender, amount);
    }

    function claimPending(address user) public {
        if (msg.sender == bankA) {
            uint256 amount = pendingForA[user];
            pendingForA[user] = 0;
            BankA(bankA).mintDepositForConsortium(user, amount);
            emit ConsortiumMintedForBank(user, amount, bankA);
        } else if (msg.sender == bankB) {
            uint256 amount = pendingForB[user];
            pendingForB[user] = 0;
            BankB(bankB).mintDepositForConsortium(user, amount);
            emit ConsortiumMintedForBank(user, amount, bankB);
        }
    }

    event ConsortiumMinted(address indexed to, uint256 amount);
    event ConsortiumBurned(address indexed from, uint256 amount);
    event ConsortiumMintedForBank(address indexed to, uint256 amount, address bank);
}