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

來驗證一下leaf中儲存的地址能不能正確的在tree中通過驗證 

JS的部分就到這邊告一段落了   















