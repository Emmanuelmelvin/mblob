// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MblobRegistry} from "../src/MblobRegistry.sol";

/// @notice Deploys MblobRegistry using values supplied through environment variables.
contract DeployMblob is Script {
    function run() external returns (MblobRegistry registry) {
        address gateway = vm.envAddress("MBLOB_GATEWAY_ADDRESS");
        uint256 pricePerByteHourWei = vm.envUint("MBLOB_PRICE_PER_BYTE_HOUR_WEI");
        uint256 minimumPriceWei = vm.envUint("MBLOB_MINIMUM_PRICE_WEI");
        uint256 permanentStorageMultiplier = vm.envUint("MBLOB_PERMANENT_STORAGE_MULTIPLIER");
        uint64 maxFileSizeBytes = uint64(vm.envUint("MBLOB_MAX_FILE_SIZE_BYTES"));
        uint64 maxDurationHours = uint64(vm.envUint("MBLOB_MAX_DURATION_HOURS"));

        vm.startBroadcast();
        registry = new MblobRegistry(
            gateway,
            pricePerByteHourWei,
            minimumPriceWei,
            permanentStorageMultiplier,
            maxFileSizeBytes,
            maxDurationHours
        );
        vm.stopBroadcast();
    }
}
