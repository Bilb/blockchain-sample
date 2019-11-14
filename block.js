const hexToBinary = require("hex-to-binary");

const { GENESIS_DATA, MINE_RATE } = require("./config");
const cryptoHash = require("./crypto-hash");

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  static adjustDifficulty({ originalBlock, timestamp }) {
    if (originalBlock.difficulty < 1) return 1;
    if (timestamp - originalBlock.timestamp > MINE_RATE)
      return originalBlock.difficulty - 1;

    return originalBlock.difficulty + 1;
  }

  static mineBlock({ lastBlock, data }) {
    let hash, timestamp;
    //const timestamp = Date.now();
    const lastHash = lastBlock.hash;
    let { difficulty } = lastBlock;
    let nonce = 0;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp
      });
      hash = cryptoHash(timestamp, nonce, difficulty, data, lastHash);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== "0".repeat(difficulty)
    );

    return new this({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash
    });
  }
}

module.exports = Block;
