const UnfoldRuntime = require("./lang/parse.js");
const EthereumWalletContext = require("./lang/EthereumWalletContext.js");
require('dotenv').config();

async function runExample() {
    const code = `# check usdc balance in wallet address

Token usdc = ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
return $.balanceOf(usdc)
     `;
    const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    const walletContext = new EthereumWalletContext(address, 'https://mainnet.infura.io/v3/' + process.env.INFURA_KEY);
    const runtime = new UnfoldRuntime(code, walletContext);

    await runtime.setup();
    console.log(runtime.ast);
    await runtime.execute();

    console.log(runtime.result());
}

runExample();