const Block = require("./block");
const cryptoHash = require("./crypto-hash");

class BlockChain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data
    });
    this.chain.push(newBlock);
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, difficulty, nonce, data } = chain[i];
      const actualLastHash = chain[i - 1].hash;
      if (lastHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(
        timestamp,
        difficulty,
        nonce,
        lastHash,
        data
      );
      if (hash !== validatedHash) return false;
    }

    return true;
  }

  replaceChain(chain) {
    if (this.chain.length >= chain.length) {
      console.error("The incoming chain must be longer");
      return;
    }
    if (!BlockChain.isValidChain(chain)) {
      console.error("The incoming chain must be valid");
      return;
    }
    console.log("Replacing the chain...");

    this.chain = chain;
  }
}

module.exports = BlockChain;
