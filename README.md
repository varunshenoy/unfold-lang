![Logo](logo.png)
<hr>

Unfold is a lightweight, domain-specific language for querying crypto wallets. It currently supports various operations, such as checking the ETH, ERC20, or ERC721 balance, on a single wallet address. 

The primary benefit of Unfold is its simplicity in usage. You can learn the entire grammar in < 5 minutes, making it a perfect low-code environment for tokengating your storefront or community. Moreover, every runtime is sandboxed and isolated from the rest of the environment. This prevents malicious users from injecting Javascript into your websites.

Sounds interesting? Check out the [demo](https://twitter.com/varunshenoy_/status/1562515808428781569?s=20&t=vEOqcAHoYnZRqwutHHddEQ)!

Want to try it out? I've set up a [playground](https://varunshenoy.com/unfold) just for you!

## Installation

Unfold is available on npm. Just run the following command in your project.

<pre>
npm i unfold-lang
</pre>

You can also manually install Unfold. This is useful if you want to make significant changes to the interpreter architecture. Just clone the repo (or manually install it) and run <code>npm install</code> in the directory.

## Set Up

After installation, you can get started in < 15 lines of code. 

<pre>
// 1. Import the context and runtime
const EthereumWalletContext = require("unfold-lang/lang/EthereumWalletContext");
const UnfoldRuntime = require("unfold-lang/lang/parse");

// Important: execution code must be in an async block because we do not want to return until the entire AST is traversed
async function run() {
    // 2. Gather code and address to query
    const code = `...`;
    const address = "0x...";

    // 3. Instantiate context and runtime
    const walletContext = new EthereumWalletContext(address, YOUR_RPC_KEY);
    const runtime = new UnfoldRuntime(code, walletContext);

    // 4. Run the interpreter
    await runtime.setup();
    console.log(runtime.ast);
    await runtime.execute();

    // 5. Print the result
    console.log(runtime.result());
}

run();
</pre>


## Under the Hood

Every time any Unfold code is written, a separate runtime instance needs to be created to execute the code. 

To maintain generalizability to other L1/L2 chains, Unfold runtimes expect two inputs: the written code and a wallet context. Wallet contexts are responsible for providing methods and attributes that interact with the chain, such as `address`, `queryNativeToken()`, `queryToken(tokenType, tokenAddress)`, and `setChain(chainId)`. 

The lexing/parsing of Unfold is handled by [nearleyjs](https://nearley.js.org/docs/index), which returns an abstract syntax tree in JSON. This tree is passed off to simple interpreter written in vanilla Javascript. 

An example of an AST (for the first example in <a href="https://github.com/varunshenoy/unfold-lang/blob/main/example_queries.txt"><code>example_queries.txt</code></a>) is shown below.

<pre>
[
  { operator: 'comment' },
  {
    operator: 'assign',
    name: 'usdc',
    value: {
      operator: 'ERC20',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    }
  },
  { operator: 'return', value: 'usdc' }
]
</pre>

## Writing Scripts

Every Unfold script is composed of statements. The Unfold runtime expects at most one statement per line. Unfold supports the usual comparators and conditional operations, as well as boolean values. 

The syntax for an conditional statement is as follows.

<pre>
<b>if</b> condition <b>then</b> directive
<b>if</b> condition <b>then</b> directive  <b>else</b> directive
</pre>

A condition includes all of the usual comparators, logical symbols, and boolean values. Conditions can compare numbers (i.e. amount of USDC in a wallet) or addresses (i.e. for whitelisting).

A directive can be a return statement, a token assignment, a chain change, or another conditional statement. 

The only type of variable in Unfold is a token. A token can be defined as follows.
<pre>
<b>Token</b> <i>TokenName</i> <b>=</b> <i>TokenObject</i>
</pre>

<i>TokenName</i> can be any string. This identifier is stored a global state that can be reused by future statements. 

<i>TokenObject</i> can be created by either specifying ERC20 or ERC721 with a contract address. 

<pre>
<b>Token</b> <i>usdc</i> <b>=</b> <i>ERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)</i>
<b>Token</b> <i>bayc</i> <b>=</b> <i>ERC721(0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D)</i>
</pre>

There is also a special TokenObject `ETH` that queries the amount of Ether in a given wallet address.

Any condition or value can be returned from the Unfold runtime through the `return` command.

Comments are prefaced with a pound symbol `#`. A comment must occupy its own line with no other code.

## Roadmap
I'm not actively working on this project, but I'll be adding features as I need them.

I'll happily merge new contexts for other L1s, for example, Solana (with the help of [@solana/web3js](https://www.npmjs.com/package/@solana/web3.js/v/0.30.8)). I want this project to be as extensible and general-purpose as possible.

Adding new primitives to the grammar would be helpful. I'm currently thinking about lists, dicts, etc. Adding types like these would increase complexity by quite a bit (adding for loops, for example), but maybe the tradeoff is worth it.

A cool idea I've been having is to extend the grammar to call methods on contracts directly. Definitely an interesting exercise in language design!