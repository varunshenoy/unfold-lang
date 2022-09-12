
const Web3 = require("web3");
const ERC20_ABI = require('./data/ERC20_ABI.js');
const ERC721_ABI = require('./data/ERC721_ABI.js');

class EthereumWalletContext {
    nativeToken = "ETH";

    constructor(address, rpc_key) {
        this.web3 = new Web3(rpc_key);
        this.address = address;
        this.isValidAddr = this.web3.utils.isAddress.bind(this);
    }

    getABI(type) {
        if (type === "ERC721") {
            return ERC721_ABI;
        }
        if (type === "ERC20") {
            return ERC20_ABI;
        }
    }

    async queryToken(tokenType, tokenAddress) {
        const contract = new this.web3.eth.Contract(this.getABI(tokenType), tokenAddress);
        contract.defaultAccount = this.address;
        const balance = await contract.methods.balanceOf(this.address).call();
        return balance;
    }

    setChain(chainId) {
        // only makes sense if we have access to Metamask and want to query for, say, an NFT on Arbitrum
    }

    async queryNativeToken() {
        const balance = await this.web3.eth.getBalance(this.address);
        return Web3.utils.fromWei(balance);
    }
}

module.exports = EthereumWalletContext;