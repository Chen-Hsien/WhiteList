// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract merkleProof{

    bytes32 public merkleRoot = 0x64115c82fbea542b73baf6c4f009f748bc5238cc3105e58e72d920703dd5e0ae;

    mapping(address => bool ) public whitelist ;

    function whitelistMint(bytes32[] calldata _merkleProof)public {
        require(!whitelist[msg.sender], "Address has already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof.");
        whitelist[msg.sender] = true;
    }


}
