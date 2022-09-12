const nearley = require("nearley");
const grammar = require("./unfold.js");

class UnfoldRuntime {
    constructor(code, walletContext) {
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

        this.returned = null;
        this.completed = false;

        this.address = walletContext.address;
        this.queryToken = walletContext.queryToken.bind(walletContext);
        this.setChain = walletContext.setChain.bind(walletContext);
        this.isValidAddr = walletContext.isValidAddr.bind(walletContext);
        this.queryNativeToken = walletContext.queryNativeToken.bind(walletContext);
        this.nativeToken = walletContext.nativeToken;
        this.table = {};

        this.lineno = 1;

        try {
            parser.feed(code);
            this.ast = parser.results;
            if (this.ast.length > 1) {
                this.ast = this.ast[0];
            }
        } catch (e) {
            throw e.message.split('\n')[0].slice(0, -1);
        }
    }

    async assign(node) {
        const name = node.name;
        const tokenAddress = node.value.address;
        const tokenType = node.value.operator;

        if (!this.isValidAddr(tokenAddress)) {
            throw "Line " + this.lineno + ": Invalid " + tokenType + " token with address " + tokenAddress + " requested."
        }

        this.table[name] = this.queryToken(node.value.operator, tokenAddress);
    }

    async query(node) {
        const balance = await this.queryToken(node.operator, node.address);
        return balance;
    }

    async setup() {
        const nativeTokenAmount = await this.queryNativeToken();
        this.table[this.nativeToken] = nativeTokenAmount;
    }

    async execute() {
        if (this.ast.length !== undefined) {
            for (const node of this.ast) {
                await this.executeLine(node);
                this.lineno += 1;
            }
        } else {
            await this.executeLine(this.ast);
        }
    }

    async if(node) {
        const cond = await this.executeLine(node.if);
        if (cond) {
            this.executeLine(node.then);
        } else if (node.else) {
            this.executeLine(node.else);
        }
    }

    async executeLine(node) {
        if (this.completed) {
            return;
        }
        if (node.operator == null) {
            // leaf node
            if (typeof node === 'string') {
                // is either a declared token, a contract, or reserved keyword (myaddress)
                if (node === "$.address") {
                    return this.address;
                }
                if (node.length === 42) {
                    return node;
                }
                if (this.table.hasOwnProperty(node)) {
                    return this.table[node];
                }
                throw "Line " + this.lineno + ": Invalid reference to token " + node + ".";
            }
            return node;
        }

        if (node.operator === 'comment') {
        } else if (node.operator === 'return') {
            this.returned = await this.executeLine(node.value);;
            this.completed = true;
            return this.returned;
        } else if (node.operator === 'assign') {
            await this.assign(node);
        } else if (node.operator === 'set_chain') {
            await this.setChain(node.chainId);
        } else if (node.operator === 'if') {
            await this.if(node);
        } else if (node.operator === 'ERC20' || node.operator === 'ERC721') {
            const balance = await this.query(node);
            return balance;
        } else if (node.operator === '>') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left > right);
        } else if (node.operator === '>=') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left >= right);
        } else if (node.operator === '==') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left == right);
        } else if (node.operator === '!=') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left != right);
        } else if (node.operator === '&&') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left && right);
        } else if (node.operator === '||') {
            const left = await this.executeLine(node.left);
            const right = await this.executeLine(node.right);
            return (left || right);
        } else if (node.operator === '!') {
            const child = await this.executeLine(node.child);
            return (!child);
        }
    }

    result() {
        if (this.completed) {
            return this.returned
        }
        return "No values returned."
    }

}

module.exports = UnfoldRuntime;