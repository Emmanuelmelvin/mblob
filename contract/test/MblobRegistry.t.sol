// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MblobRegistry} from "../src/MblobRegistry.sol";

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function prank(address sender) external;
    function warp(uint256 newTimestamp) external;
}

/// @dev Minimal test base so core tests do not depend on forge-std.
contract MblobRegistryTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address private constant GATEWAY = address(0xBEEF);
    address private constant USER = address(0xA11CE);
    MblobRegistry private registry;

    function setUp() public {
        registry = new MblobRegistry(
            GATEWAY,
            2, // wei per byte-hour
            100,
            1_000,
            10_000_000,
            720
        );
        vm.deal(USER, 1 ether);
    }

    function testQuoteUsesAllTemporaryStorageInputs() public view {
        uint256 price = registry.quote(1_000, 24, 2, false);
        assertEq(price, 96_000);
    }

    function testCreateBlobRecordsPaidPendingBlob() public {
        uint256 price = registry.quote(1_000, 24, 3, false);
        vm.prank(USER);
        uint256 blobId = registry.createBlob{value: price}(
            bytes32(uint256(1)), bytes32(uint256(2)), 1_000, 24, 3, false
        );

        MblobRegistry.Blob memory blob = registry.getBlob(blobId);
        assertEq(blob.owner, USER);
        assertEq(blob.fileSizeBytes, 1_000);
        assertEq(uint256(blob.status), uint256(MblobRegistry.BlobStatus.Pending));
        assertEq(blob.payment, price);
    }

    function testOnlyGatewayCanActivateBlob() public {
        uint256 blobId = _createBlob();

        vm.prank(USER);
        (bool success,) = address(registry).call(
            abi.encodeCall(registry.activateBlob, (blobId, bytes32(uint256(3))))
        );
        assertTrue(!success);

        vm.prank(GATEWAY);
        registry.activateBlob(blobId, bytes32(uint256(3)));
        MblobRegistry.Blob memory blob = registry.getBlob(blobId);
        assertEq(uint256(blob.status), uint256(MblobRegistry.BlobStatus.Active));
    }

    function testGatewayCanDeleteActiveBlobAfterExpiry() public {
        uint256 blobId = _createBlob();
        vm.prank(GATEWAY);
        registry.activateBlob(blobId, bytes32(uint256(3)));

        MblobRegistry.Blob memory blob = registry.getBlob(blobId);
        vm.warp(uint256(blob.expiresAt));
        vm.prank(GATEWAY);
        registry.markDeleted(blobId);

        blob = registry.getBlob(blobId);
        assertEq(uint256(blob.status), uint256(MblobRegistry.BlobStatus.Deleted));
    }

    function _createBlob() private returns (uint256) {
        uint256 price = registry.quote(1_000, 1, 1, false);
        vm.prank(USER);
        return registry.createBlob{value: price}(
            bytes32(uint256(1)), bytes32(uint256(2)), 1_000, 1, 1, false
        );
    }

    function assertEq(uint256 left, uint256 right) private pure {
        require(left == right, "uint values differ");
    }

    function assertEq(address left, address right) private pure {
        require(left == right, "addresses differ");
    }

    function assertTrue(bool value) private pure {
        require(value, "assertion failed");
    }
}
