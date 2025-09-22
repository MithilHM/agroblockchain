// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SupplyChain
 * @dev Smart contract for agricultural supply chain transparency
 * @author AgroBlockchain Team
 */
contract SupplyChain is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Batch status enum
    enum BatchStatus {
        Registered,    // 0 - Initially registered by farmer
        Harvested,     // 1 - Produce harvested
        Processed,     // 2 - Processed (if applicable)
        InTransit,     // 3 - In transit to distributor/retailer
        Delivered,     // 4 - Delivered to distributor/retailer
        Sold          // 5 - Sold to consumer
    }

    // Batch structure
    struct Batch {
        string batchId;           // Unique batch identifier
        string produceType;       // Type of produce (e.g., "Tomatoes", "Rice")
        string variety;           // Variety of produce
        uint256 quantity;         // Quantity in kg or appropriate unit
        string origin;            // Farm location/origin
        address farmer;           // Farmer's address
        address currentOwner;     // Current owner's address
        uint256 basePrice;        // Base price set by farmer
        uint256 currentPrice;     // Current market price
        BatchStatus status;       // Current status
        uint256 harvestDate;      // Harvest timestamp
        uint256 expiryDate;       // Expiration timestamp
        string certificationHash; // IPFS hash of certification documents
        string imageHash;         // IPFS hash of product images
        bool isOrganic;           // Organic certification flag
        string[] transferHistory; // History of ownership transfers
        uint256 createdAt;        // Creation timestamp
        uint256 updatedAt;        // Last update timestamp
    }

    // Quality check structure
    struct QualityCheck {
        address inspector;        // Inspector's address
        uint256 timestamp;        // Inspection timestamp
        uint8 qualityScore;       // Quality score (0-100)
        string remarks;           // Inspector remarks
        string reportHash;        // IPFS hash of quality report
        bool passed;              // Whether quality check passed
    }

    // Transfer event structure
    struct Transfer {
        address from;             // Previous owner
        address to;               // New owner
        uint256 timestamp;        // Transfer timestamp
        uint256 price;            // Transfer price
        string location;          // Transfer location
        string remarks;           // Transfer remarks
    }

    // State variables
    Counters.Counter private _batchCounter;
    mapping(string => Batch) public batches;
    mapping(string => QualityCheck[]) public qualityChecks;
    mapping(string => Transfer[]) public transfers;
    mapping(address => string[]) public userBatches;
    
    string[] public allBatchIds;

    // Events
    event BatchRegistered(
        string indexed batchId,
        address indexed farmer,
        string produceType,
        uint256 quantity,
        string origin
    );

    event BatchTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        uint256 price,
        string location
    );

    event BatchStatusUpdated(
        string indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        address updatedBy
    );

    event QualityCheckAdded(
        string indexed batchId,
        address indexed inspector,
        uint8 qualityScore,
        bool passed
    );

    event PriceUpdated(
        string indexed batchId,
        uint256 oldPrice,
        uint256 newPrice,
        address updatedBy
    );

    event BatchSold(
        string indexed batchId,
        address indexed seller,
        address indexed buyer,
        uint256 finalPrice
    );

    // Modifiers
    modifier onlyBatchOwner(string memory _batchId) {
        require(
            batches[_batchId].currentOwner == msg.sender,
            "Only batch owner can perform this action"
        );
        _;
    }

    modifier batchExists(string memory _batchId) {
        require(
            bytes(batches[_batchId].batchId).length > 0,
            "Batch does not exist"
        );
        _;
    }

    modifier validStatus(string memory _batchId, BatchStatus _requiredStatus) {
        require(
            batches[_batchId].status == _requiredStatus,
            "Invalid batch status for this operation"
        );
        _;
    }

    /**
     * @dev Constructor - sets up initial roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @dev Register a new produce batch
     * @param _batchId Unique identifier for the batch
     * @param _produceType Type of produce
     * @param _variety Variety of produce
     * @param _quantity Quantity in appropriate units
     * @param _origin Farm location
     * @param _basePrice Base price set by farmer
     * @param _expiryDate Expiration timestamp
     * @param _certificationHash IPFS hash of certifications
     * @param _imageHash IPFS hash of images
     * @param _isOrganic Organic certification status
     */
    function registerBatch(
        string memory _batchId,
        string memory _produceType,
        string memory _variety,
        uint256 _quantity,
        string memory _origin,
        uint256 _basePrice,
        uint256 _expiryDate,
        string memory _certificationHash,
        string memory _imageHash,
        bool _isOrganic
    ) external onlyRole(FARMER_ROLE) whenNotPaused nonReentrant {
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(batches[_batchId].batchId).length == 0, "Batch already exists");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_basePrice > 0, "Price must be greater than 0");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");

        // Create new batch
        Batch storage newBatch = batches[_batchId];
        newBatch.batchId = _batchId;
        newBatch.produceType = _produceType;
        newBatch.variety = _variety;
        newBatch.quantity = _quantity;
        newBatch.origin = _origin;
        newBatch.farmer = msg.sender;
        newBatch.currentOwner = msg.sender;
        newBatch.basePrice = _basePrice;
        newBatch.currentPrice = _basePrice;
        newBatch.status = BatchStatus.Registered;
        newBatch.harvestDate = block.timestamp;
        newBatch.expiryDate = _expiryDate;
        newBatch.certificationHash = _certificationHash;
        newBatch.imageHash = _imageHash;
        newBatch.isOrganic = _isOrganic;
        newBatch.createdAt = block.timestamp;
        newBatch.updatedAt = block.timestamp;

        // Add to tracking arrays
        allBatchIds.push(_batchId);
        userBatches[msg.sender].push(_batchId);

        _batchCounter.increment();

        emit BatchRegistered(_batchId, msg.sender, _produceType, _quantity, _origin);
    }

    /**
     * @dev Transfer batch ownership
     * @param _batchId Batch identifier
     * @param _to New owner address
     * @param _price Transfer price
     * @param _location Transfer location
     * @param _remarks Transfer remarks
     */
    function transferBatch(
        string memory _batchId,
        address _to,
        uint256 _price,
        string memory _location,
        string memory _remarks
    ) external onlyBatchOwner(_batchId) batchExists(_batchId) whenNotPaused nonReentrant {
        require(_to != address(0), "Invalid recipient address");
        require(_to != msg.sender, "Cannot transfer to yourself");
        require(_price > 0, "Transfer price must be greater than 0");
        
        Batch storage batch = batches[_batchId];
        require(batch.status != BatchStatus.Sold, "Cannot transfer sold batch");

        address previousOwner = batch.currentOwner;
        
        // Update batch ownership and price
        batch.currentOwner = _to;
        batch.currentPrice = _price;
        batch.updatedAt = block.timestamp;

        // Record transfer
        transfers[_batchId].push(Transfer({
            from: previousOwner,
            to: _to,
            timestamp: block.timestamp,
            price: _price,
            location: _location,
            remarks: _remarks
        }));

        // Update transfer history
        batch.transferHistory.push(string(abi.encodePacked(
            "Transfer from ", 
            _addressToString(previousOwner),
            " to ",
            _addressToString(_to),
            " at ",
            _uint256ToString(block.timestamp)
        )));

        // Add to new owner's batches
        userBatches[_to].push(_batchId);

        emit BatchTransferred(_batchId, previousOwner, _to, _price, _location);
    }

    /**
     * @dev Update batch status
     * @param _batchId Batch identifier
     * @param _newStatus New status
     */
    function updateBatchStatus(
        string memory _batchId,
        BatchStatus _newStatus
    ) external batchExists(_batchId) whenNotPaused {
        Batch storage batch = batches[_batchId];
        
        // Check permissions based on status
        if (_newStatus == BatchStatus.Harvested) {
            require(hasRole(FARMER_ROLE, msg.sender), "Only farmers can mark as harvested");
        } else if (_newStatus == BatchStatus.InTransit || _newStatus == BatchStatus.Delivered) {
            require(
                hasRole(DISTRIBUTOR_ROLE, msg.sender) || batch.currentOwner == msg.sender,
                "Unauthorized to update transit status"
            );
        } else if (_newStatus == BatchStatus.Sold) {
            require(
                hasRole(RETAILER_ROLE, msg.sender) || batch.currentOwner == msg.sender,
                "Only retailers can mark as sold"
            );
        }

        BatchStatus oldStatus = batch.status;
        batch.status = _newStatus;
        batch.updatedAt = block.timestamp;

        emit BatchStatusUpdated(_batchId, oldStatus, _newStatus, msg.sender);
    }

    /**
     * @dev Add quality check record
     * @param _batchId Batch identifier
     * @param _qualityScore Quality score (0-100)
     * @param _remarks Inspector remarks
     * @param _reportHash IPFS hash of quality report
     */
    function addQualityCheck(
        string memory _batchId,
        uint8 _qualityScore,
        string memory _remarks,
        string memory _reportHash
    ) external onlyRole(REGULATOR_ROLE) batchExists(_batchId) whenNotPaused {
        require(_qualityScore <= 100, "Quality score must be between 0-100");

        QualityCheck memory newCheck = QualityCheck({
            inspector: msg.sender,
            timestamp: block.timestamp,
            qualityScore: _qualityScore,
            remarks: _remarks,
            reportHash: _reportHash,
            passed: _qualityScore >= 70 // 70+ is considered passing
        });

        qualityChecks[_batchId].push(newCheck);

        emit QualityCheckAdded(_batchId, msg.sender, _qualityScore, newCheck.passed);
    }

    /**
     * @dev Update batch price
     * @param _batchId Batch identifier  
     * @param _newPrice New price
     */
    function updatePrice(
        string memory _batchId,
        uint256 _newPrice
    ) external onlyBatchOwner(_batchId) batchExists(_batchId) whenNotPaused {
        require(_newPrice > 0, "Price must be greater than 0");
        
        Batch storage batch = batches[_batchId];
        uint256 oldPrice = batch.currentPrice;
        
        batch.currentPrice = _newPrice;
        batch.updatedAt = block.timestamp;

        emit PriceUpdated(_batchId, oldPrice, _newPrice, msg.sender);
    }

    /**
     * @dev Mark batch as sold
     * @param _batchId Batch identifier
     * @param _buyer Buyer address
     * @param _finalPrice Final selling price
     */
    function markAsSold(
        string memory _batchId,
        address _buyer,
        uint256 _finalPrice
    ) external onlyBatchOwner(_batchId) batchExists(_batchId) whenNotPaused {
        require(_buyer != address(0), "Invalid buyer address");
        require(_finalPrice > 0, "Final price must be greater than 0");
        
        Batch storage batch = batches[_batchId];
        require(batch.status != BatchStatus.Sold, "Batch already sold");

        batch.status = BatchStatus.Sold;
        batch.currentPrice = _finalPrice;
        batch.updatedAt = block.timestamp;

        emit BatchSold(_batchId, msg.sender, _buyer, _finalPrice);
    }

    // View functions

    /**
     * @dev Get batch details
     * @param _batchId Batch identifier
     * @return Batch struct
     */
    function getBatch(string memory _batchId) external view returns (Batch memory) {
        require(bytes(batches[_batchId].batchId).length > 0, "Batch does not exist");
        return batches[_batchId];
    }

    /**
     * @dev Get quality checks for a batch
     * @param _batchId Batch identifier
     * @return Array of quality checks
     */
    function getQualityChecks(string memory _batchId) external view returns (QualityCheck[] memory) {
        return qualityChecks[_batchId];
    }

    /**
     * @dev Get transfer history for a batch
     * @param _batchId Batch identifier
     * @return Array of transfers
     */
    function getTransferHistory(string memory _batchId) external view returns (Transfer[] memory) {
        return transfers[_batchId];
    }

    /**
     * @dev Get all batches owned by a user
     * @param _user User address
     * @return Array of batch IDs
     */
    function getUserBatches(address _user) external view returns (string[] memory) {
        return userBatches[_user];
    }

    /**
     * @dev Get total number of batches
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchCounter.current();
    }

    /**
     * @dev Get all batch IDs
     * @return Array of all batch IDs
     */
    function getAllBatchIds() external view returns (string[] memory) {
        return allBatchIds;
    }

    /**
     * @dev Check if batch exists
     * @param _batchId Batch identifier
     * @return Boolean indicating existence
     */
    function batchExists(string memory _batchId) external view returns (bool) {
        return bytes(batches[_batchId].batchId).length > 0;
    }

    // Admin functions

    /**
     * @dev Grant role to user (only admin)
     * @param _role Role to grant
     * @param _user User address
     */
    function grantUserRole(bytes32 _role, address _user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(_role, _user);
    }

    /**
     * @dev Revoke role from user (only admin)
     * @param _role Role to revoke
     * @param _user User address
     */
    function revokeUserRole(bytes32 _role, address _user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(_role, _user);
    }

    /**
     * @dev Pause contract (only admin)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (only admin)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Helper functions

    /**
     * @dev Convert address to string
     * @param _addr Address to convert
     * @return String representation
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Convert uint256 to string
     * @param _i Integer to convert
     * @return String representation
     */
    function _uint256ToString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b = bytes1(temp);
            bstr[k] = b;
            _i /= 10;
        }
        return string(bstr);
    }
}