// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MblobRegistry
/// @notice Stores Mblob payment and storage metadata; file bytes never enter the contract.
contract MblobRegistry {
    enum BlobStatus {
        Pending,
        Active,
        Deleted
    }

    struct Blob {
        address owner;
        bytes32 fileHash;
        bytes32 encryptionMetadataHash;
        bytes32 storageNodesCommitment;
        uint64 fileSizeBytes;
        uint64 createdAt;
        uint64 expiresAt;
        uint8 replicationFactor;
        bool deletable;
        BlobStatus status;
        uint256 payment;
    }

    error Unauthorized();
    error InvalidAddress();
    error InvalidFileSize();
    error InvalidDuration();
    error InvalidReplicationFactor();
    error IncorrectPayment(uint256 required, uint256 supplied);
    error BlobNotFound(uint256 blobId);
    error InvalidStatus(BlobStatus expected, BlobStatus actual);
    error BlobNotExpired(uint256 blobId, uint64 expiresAt);
    error TransferFailed();

    event BlobCreated(
        uint256 indexed blobId,
        address indexed owner,
        bytes32 indexed fileHash,
        uint64 expiresAt,
        uint256 payment
    );
    event BlobActivated(uint256 indexed blobId, bytes32 storageNodesCommitment);
    event BlobDeleted(uint256 indexed blobId);
    event GatewayUpdated(address indexed previousGateway, address indexed newGateway);

    address public owner;
    address public gateway;

    // Pricing inputs are public so the frontend, gateway, and contract share one formula.
    uint256 public immutable pricePerByteHourWei;
    uint256 public immutable minimumPriceWei;
    uint256 public immutable permanentStorageMultiplier;
    uint64 public immutable maxFileSizeBytes;
    uint64 public immutable maxDurationHours;

    uint256 public nextBlobId = 1;
    mapping(uint256 blobId => Blob blob) private blobs;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != gateway) revert Unauthorized();
        _;
    }

    constructor(
        address initialGateway,
        uint256 _pricePerByteHourWei,
        uint256 _minimumPriceWei,
        uint256 _permanentStorageMultiplier,
        uint64 _maxFileSizeBytes,
        uint64 _maxDurationHours
    ) {
        if (initialGateway == address(0)) revert InvalidAddress();
        if (_permanentStorageMultiplier == 0) revert InvalidDuration();
        if (_maxFileSizeBytes == 0 || _maxDurationHours == 0) revert InvalidFileSize();

        owner = msg.sender;
        gateway = initialGateway;
        pricePerByteHourWei = _pricePerByteHourWei;
        minimumPriceWei = _minimumPriceWei;
        permanentStorageMultiplier = _permanentStorageMultiplier;
        maxFileSizeBytes = _maxFileSizeBytes;
        maxDurationHours = _maxDurationHours;
    }

    /// @notice Returns the exact native-MON amount required for an upload request.
    function quote(
        uint64 fileSizeBytes,
        uint64 durationHours,
        uint8 replicationFactor,
        bool permanent
    ) public view returns (uint256) {
        _validateStorageRequest(fileSizeBytes, durationHours, replicationFactor, permanent);

        uint256 price = uint256(fileSizeBytes) * pricePerByteHourWei * replicationFactor;
        if (permanent) {
            price *= permanentStorageMultiplier;
        } else {
            price *= durationHours;
        }
        return price < minimumPriceWei ? minimumPriceWei : price;
    }

    /// @notice Creates a pending metadata record after the user pays on-chain.
    /// @dev The gateway must later activate the record after all shard uploads succeed.
    function createBlob(
        bytes32 fileHash,
        bytes32 encryptionMetadataHash,
        uint64 fileSizeBytes,
        uint64 durationHours,
        uint8 replicationFactor,
        bool permanent
    ) external payable returns (uint256 blobId) {
        uint256 requiredPayment = quote(fileSizeBytes, durationHours, replicationFactor, permanent);
        if (msg.value != requiredPayment) revert IncorrectPayment(requiredPayment, msg.value);

        blobId = nextBlobId++;
        uint64 expiresAt = permanent ? 0 : uint64(block.timestamp + uint256(durationHours) * 1 hours);
        blobs[blobId] = Blob({
            owner: msg.sender,
            fileHash: fileHash,
            encryptionMetadataHash: encryptionMetadataHash,
            storageNodesCommitment: bytes32(0),
            fileSizeBytes: fileSizeBytes,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            replicationFactor: replicationFactor,
            deletable: !permanent,
            status: BlobStatus.Pending,
            payment: msg.value
        });

        emit BlobCreated(blobId, msg.sender, fileHash, expiresAt, msg.value);
    }

    /// @notice Confirms that storage nodes accepted the encrypted payload.
    /// @param storageNodesCommitment Hash of the ordered node IDs and shard receipts kept off-chain.
    function activateBlob(uint256 blobId, bytes32 storageNodesCommitment) external onlyGateway {
        Blob storage blob = _blob(blobId);
        if (blob.status != BlobStatus.Pending) revert InvalidStatus(BlobStatus.Pending, blob.status);
        if (storageNodesCommitment == bytes32(0)) revert InvalidAddress();

        blob.storageNodesCommitment = storageNodesCommitment;
        blob.status = BlobStatus.Active;
        emit BlobActivated(blobId, storageNodesCommitment);
    }

    /// @notice Marks an expired deletable blob as deleted after the worker removes its shards.
    function markDeleted(uint256 blobId) external onlyGateway {
        Blob storage blob = _blob(blobId);
        if (!blob.deletable || blob.expiresAt == 0 || block.timestamp < blob.expiresAt) {
            revert BlobNotExpired(blobId, blob.expiresAt);
        }
        if (blob.status != BlobStatus.Active) revert InvalidStatus(BlobStatus.Active, blob.status);

        blob.status = BlobStatus.Deleted;
        emit BlobDeleted(blobId);
    }

    function getBlob(uint256 blobId) external view returns (Blob memory) {
        return _blob(blobId);
    }

    function setGateway(address newGateway) external onlyOwner {
        if (newGateway == address(0)) revert InvalidAddress();
        emit GatewayUpdated(gateway, newGateway);
        gateway = newGateway;
    }

    function withdraw(address payable recipient) external onlyOwner {
        if (recipient == address(0)) revert InvalidAddress();
        (bool sent,) = recipient.call{value: address(this).balance}("");
        if (!sent) revert TransferFailed();
    }

    function _blob(uint256 blobId) private view returns (Blob storage blob) {
        blob = blobs[blobId];
        if (blob.owner == address(0)) revert BlobNotFound(blobId);
    }

    function _validateStorageRequest(
        uint64 fileSizeBytes,
        uint64 durationHours,
        uint8 replicationFactor,
        bool permanent
    ) private view {
        if (fileSizeBytes == 0 || fileSizeBytes > maxFileSizeBytes) revert InvalidFileSize();
        if (replicationFactor == 0 || replicationFactor > 3) revert InvalidReplicationFactor();
        if (!permanent && (durationHours == 0 || durationHours > maxDurationHours)) revert InvalidDuration();
    }
}
