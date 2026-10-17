// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {GitAura} from "../src/GitAura.sol";

/// Pemakaian (lihat docs/SETUP.md):
///   ATTESTER_ADDRESS=0x... forge script script/Deploy.s.sol --rpc-url bohr --broadcast --account <keystore>
contract Deploy is Script {
    function run() external returns (GitAura ga) {
        address attester = vm.envAddress("ATTESTER_ADDRESS");

        vm.startBroadcast();
        ga = new GitAura(attester);
        vm.stopBroadcast();

        console.log("GitAura deployed at:", address(ga));
        console.log("attester:", attester);
        console.log("chain id:", block.chainid);
    }
}
