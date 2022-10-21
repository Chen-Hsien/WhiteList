# WhiteList-MerkleTree
白名單的驗證方式根據Zombie Club團隊介紹大致有以下三種
1. 在合約指定簽章者地址，然後用對應的私鑰off-chain生成簽章，在mint時，再於合約中驗證簽章是否正確.  
2. 以白名單地址建立Merkel tree，mint時以Merkle tree proof檢查地址是否在白名單內.  
3. 將白名單地址全部寫在合約中，直接驗證.  

1,2 互有優缺第三種可確認的是, 會花費高昂的GAS FEE在處理白名單地址.  
我們將實作Merkel Tree以及off-chain簽章來進行白名單的驗證練習, 本篇先嘗試Merkel Tree~.  

Merkel Tree

![image](https://user-images.githubusercontent.com/24216536/197123828-1ab168d8-3bc0-4288-9c06-28755aefc3b5.png)

由三種節點組成.  
Leaf Nodes - 位於樹的最底部,例如。如果需要對 7 條數據進行Hash，則將有 7 個Leaf Node.  
Parent Nodes - 位於樹的不同級別, 皆位於Leaf Nodes之上, 最少擁有一個Leaf Node,最多二個.  
Root Node - 位於樹的頂部, 由旗下兩個Parent Nodes Hash出, 每棵Tree只會有一個Root Node.  

在已知所有白名單地址後, 就可以開始創建Merkle Tree嚕   

Openzeppelin [MerkleProof.sol]([url](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol))   
有提供實作的MerkleTree可供參考.  
```Solidity
function verifyCalldata(
    bytes32[] calldata proof,
    bytes32 root,
    bytes32 leaf
) internal pure returns (bool) {
    return processProofCalldata(proof, leaf) == root;
}

function processProofCalldata(
    bytes32[] calldata proof,
    bytes32 leaf,
) internal pure returns (bytes32) {
    bytes32 computedHash = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        computedHash = _hashPair(computedHash, proof[i]);
    }
    return computedHash;
}

function _hashPair(bytes32 a, bytes32 b)
    private
    pure
    returns(bytes32)
{
    return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
}

function _efficientHash(bytes32 a, bytes32 b)
    private
    pure
    returns (bytes32 value)
{
    assembly {
        mstore(0x00, a)
        mstore(0x20, b)
        value := keccak256(0x00, 0x40)
    }
}
```
verifyCalldata中三個參數分別如下, leaf其實就是mint用戶傳入的錢包地址。  
通過leaf和對應節點的hash循環計算出root hash值, 並與傳入之root hash驗證相等則通關白名單驗證!   
| Name        | Type           | Description  |
| ------------- |------------- | -----|
| proof | bytes32[] | Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree | 
| root | bytes32 | Merkle root | 
| leaf | bytes32 | Leaf of Merkle tree | 
      
接下來我們用JS搭配Solidity實作一個白名單出來吧     

[`WhiteList-MerkleTree/merkletree.js`](merkletree.js).  
這邊引用兩個函式庫keccak256, merkletreejs來實作。  
whitelistAddresses[]中有前兩個是我個人測試用的錢包位址,後五個則是隨機生成地址, 還保留一個非白名單的個人測試地址來試試看能不能被阻擋mint吧～  
1. 將whitelistAddresses map 為leafNodes
2. new merkleTree帶入leafNodes
就完成建立囉, 接著可以getRoot得到未來要存入smart contract 的root hash.  
這邊就將整顆tree圖像畫出來看看是不是長得跟想像中一樣嚕。  

![image](https://user-images.githubusercontent.com/24216536/197158555-d22d8fac-ec77-4823-9007-61f780ec801d.png)   
可以看到總共為四層的結構, leaf nodes 確實同輸入的7個地址數量.   
而未來在合約中就不需要leaf node的資料就可以進行驗證傳入的地址是否屬於merkle tree的一部分.  

來驗證一下leaf中儲存的地址能不能正確的在tree中通過驗證, 可以正確分辨出白名單地址與非白名單地址.  
```Javascript
let leaf = keccak256('0x7d566a978b786175B70F1E34a94560f5497E49CF');
let proof = merkleTree.getHexProof(leaf);
let leaffake = keccak256('0x7d566a978b786175B70F1E34a94560f5497E49XX');
proof = merkleTree.getHexProof(leaffake);
```
![image](https://user-images.githubusercontent.com/24216536/197184452-e85b9b0a-d92b-4863-acc0-f0dc4a21bb0e.png).  
   
也可以在js調用verify來驗證是偶為tree中的地址~.  
```Javascript
 const claimingAddress = leafNodes[0];
 const hexProof = merkleTree.getHexProof(claimingAddress);
 console.log(merkleTree.verify(hexProof, claimingAddress, rootHash))
```
JS的部分就到這邊告一段落了   

[`WhiteList-MerkleTree/MerkleTreeProof.sol`](MerkleTreeProof.sol).  

程式的內容很單純, 就是帶入js中產出的rootHash, 並提供function傳入merkleProof來進行驗證白單。  
```Solidity
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
```
部署於[EtherScan](https://goerli.etherscan.io/address/0x107978c61d59830d0bf90ea011ce5b918cbd8b62).  
<img width="396" alt="image" src="https://user-images.githubusercontent.com/24216536/197229274-614c4e02-0695-403c-8663-a0db065abc48.png">  
其中whitelistMint需傳入的_merkleProof即是JS 中 紀錄的 hexProof變數.  

若為白名單中的地址就可以在成功後於whitelist中輸入address查詢, 並會回傳true!  
<img width="282" alt="image" src="https://user-images.githubusercontent.com/24216536/197230618-cbac3b9c-fe97-418a-8c50-a10c798e4331.png">.  

來試試看不在白單內的地址,被狠狠地拒絕了   
![image](https://user-images.githubusercontent.com/24216536/197231277-a5ef606b-1d6f-47bf-90dd-bb095aed7ab9.png).  
<img width="507" alt="image" src="https://user-images.githubusercontent.com/24216536/197231155-b705fc31-c6d0-463d-87ca-f0af37481117.png">   

那merkle tree實作就到這邊~~~














