const { MerkleTree } = require('merkletreejs');
const keccak256  = require('keccak256')


let whitelistAddresses = [
"0x7d566a978b786175B70F1E34a94560f5497E49CF",
"0x4705650A5ef39Ae8Efa2c1D04c9B801526162bE5",
"0xcd2ba669eFEA6d7f420B09dDF03520F369131eD2",
"0xf99BD473Dc834408610426A1B11d7328933b0FB8",
"0xa778C17aC550dF2FAf08d8646E52ab2e382eBF9d",
"0xf7Ecd1D3E56f97e3caDA93dDA0AE6C8b3aDa27E0",
"0xfac9d58FB9e80Cd36e86e10B63461f9c004287aF"
]

const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs:true});

const rootHash = merkleTree.getHexRoot();

 console.log(rootHash);
// console.log("Merkle Tree Diagam\n", merkleTree.toString());

let leaf = keccak256('0x7d566a978b786175B70F1E34a94560f5497E49CF');
let proof = merkleTree.getHexProof(leaf);
console.log('Proof of 0x7d566a978b786175B70F1E34a94560f5497E49CF: ', proof);

let leaffake = keccak256('0x7d566a978b786175B70F1E34a94560f5497E49XX');
proof = merkleTree.getHexProof(leaffake);
console.log('Proof of 0x7d566a978b786175B70F1E34a94560f5497E49XX: ', proof);

 const claimingAddress = leafNodes[0];
 const hexProof = merkleTree.getHexProof(claimingAddress);
 
 console.log(hexProof);
 console.log(merkleTree.verify(hexProof, claimingAddress, rootHash))

