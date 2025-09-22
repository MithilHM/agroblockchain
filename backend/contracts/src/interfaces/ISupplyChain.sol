// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ISupplyChain
 * @dev Interface for the SupplyChain contract
 */
interface ISupplyChain {
    // Enums
    enum BatchStatus {
        Registered,
        Harvested,
        Processed,
        InTransit,
        Delivered,
        Sold
    }

    // Structs
    struct Batch {
        string batchId;
        string produceType;
        string variety;
        uint256 quantity;
        string origin;
        address farmer;
        address currentOwner;
        uint256 basePrice;
        uint256 currentPrice;
        BatchStatus status;
        uint256 harvestDate;
        uint256 expiryDate;
        string certificationHash;
        string imageHash;
        bool isOrganic;
        string[] transferHistory;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct QualityCheck {
        address inspector;
        uint256 timestamp;
        uint8 qualityScore;
        string remarks;
        string reportHash;
        bool passed;
    }

    struct Transfer {
        address from;
        address to;
        uint256 timestamp;
        uint256 price;
        string location;
        string remarks;
    }

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

    // Core functions
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
    ) external;

    function transferBatch(
        string memory _batchId,
        address _to,
        uint256 _price,
        string memory _location,
        string memory _remarks
    ) external;

    function updateBatchStatus(
        string memory _batchId,
        BatchStatus _newStatus
    ) external;

    function addQualityCheck(
        string memory _batchId,
        uint8 _qualityScore,
        string memory _remarks,
        string memory _reportHash
    ) external;

    // View functions
    function getBatch(string memory _batchId) external view returns (Batch memory);
    function getQualityChecks(string memory _batchId) external view returns (QualityCheck[] memory);
    function getTransferHistory(string memory _batchId) external view returns (Transfer[] memory);
    function getUserBatches(address _user) external view returns (string[] memory);
    function getTotalBatches() external view returns (uint256);
    function batchExists(string memory _batchId) external view returns (bool);
}