const crypto = require("crypto");

const NONCE_LEN = 8;
const DIFFICULTY = 10;

// Calculate the target PoW value for a particular payload
// The first 8 bytes of the hash found must be <= this value
const calcTarget = (ttl, payloadLen) => {
  // payloadLength + NONCE_LEN
  const totalLen = payloadLen + NONCE_LEN;
  // ttl converted to seconds
  const ttlSeconds = ttl / 1000;
  // ttl * totalLen
  const ttlMult = ttlSeconds * totalLen;
  // 2^16 - 1
  const two16 = Math.pow(2, 16) - 1;
  // ttlMult / two16
  const innerFrac = ttlMult / two16;
  // totalLen + innerFrac
  const lenPlusInnerFrac = totalLen + innerFrac;
  // difficulty * lenPlusInnerFrac
  const denominator = DIFFICULTY * lenPlusInnerFrac;
  // 2^64 - 1
  const two64 = Math.pow(2, 64) - 1;
  // two64 / denominator
  const targetNum = two64 / denominator;
  return intToUint8Array(targetNum);
  // Uint8Array([0,60,174,111,128,140,44,148])
};

const intToUint8Array = num => {
  const arr = new Uint8Array(NONCE_LEN);
  for (let idx = NONCE_LEN - 1; idx >= 0; idx -= 1) {
    const n = NONCE_LEN - (idx + 1);
    // 256 ** n is the value of one bit in arr[idx], modulus to carry over
    // (bigInt / 256**n) % 256;
    const denominator = Math.pow(256, n);
    const fraction = num / denominator;
    const uint8Val = fraction % 256;
    arr[idx] = uint8Val;
  }
  return arr;
};

// Classes
// ==================================================================

class StorageServer {
  constructor() {
    this.history = [];
  }

  submitMessage(message, nonce) {
    const valid = verifyPoW(message, nonce);
    if (valid) {
      this.history.push(message);
      console.log("Valid message. New history:");
      this.history.forEach(message => console.log(message.content));
    } else {
      console.log("Invalid message, not adding to history:");
    }
  }
}

class Message {
  constructor(sender, destination, content, timestamp) {
    this.sender = sender;
    this.destination = destination;
    this.content = content;
    this.timestamp = Date.now();
    this.ttl = 24 * 60 * 60 * 1000; // Default to one day
  }
}

class Client {
  constructor(name, server) {
    this.name = name;
    this.server = server;
  }

  async sendMessage(destinationClient, content) {
    const message = new Message(this.name, destinationClient.name, content);
    const nonce = calcPoW(message);
    this.server.submitMessage(message, nonce);
  }
}

// You can modify code below this line
// ===================================================================================

const greaterThan = (arr1, arr2) => {
  // You will be implementing this function

  // This function should compare two Uint8Arrays and return
  // true if arr1 is > arr2
  // Can assume the arrays are the same length
  // EXAMPLES:
  // [0, 0, 10], [0, 0, 1] => true
  // [0, 30, 11], [0, 29, 150] => true
  // [1, 0, 0], [0, 255, 255] => true
  // [0, 255, 255], [1, 0, 0] => false

  for (let i = 0; i < NONCE_LEN; i++) {
    if (arr1[i] < arr2[i]) return false;
    if (arr1[i] > arr2[i]) return true;
  }

  return true;
};

const incrementNonce = nonce => {
  // You will be implementing this function

  // This function should increment a nonce represented as a Uint8Array
  // EXAMPLES:
  // new Uint8Array([0, 0, 30, 23, 43, 62, 1, 0])
  // [0, 0, 0, 0, 0, 0, 0, 0] => [0, 0, 0, 0, 0, 0, 0, 1]
  // [0, 0, 0, 0, 0, 0, 0, 255] => [0, 0, 0, 0, 0, 0, 1, 0]
  // [0, 0, 0, 5, 29, 101, 7, 255] => [0, 0, 0, 5, 29, 101, 8, 0]
  // [255, 255, 255, 255, 255, 255, 255, 255] => [0, 0, 0, 0, 0, 0, 0, 0]
  // 09 => 10

  const newNonce = nonce;
  var overflow = 0;

  for (let i = nonce.length; i >= 0; i--) {
    if (newNonce[i] < 255) {
      newNonce[i]++;

      break;
    } else if (newNonce[i] === 255) {
      newNonce[i] = 0;
    }
  }

  return newNonce;
};
const testArr = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]);
console.log(`Initial = ${testArr} result = ${incrementNonce(testArr)}`);

const calcPoW = message => {
  // You will be implementing this function

  // This function should try to find a nonce which can be combined with a
  // hash of the message data and then hashed again, and the first 8 bytes
  // of this resulting hash will be less than the target
  // More explicitly:
  // greaterThan(target, sha512(nonce.concat(sha512(messageData))).slice(0, 8)) === true

  const payload =
    message.ttl +
    message.destination +
    message.sender +
    message.timestamp +
    message.content;
  let sha512 = crypto.createHash("sha512");
  sha512.update(payload);
  const payloadHash = sha512.digest();

  let innerPayload;
  let innerPayloadHash;
  const target = calcTarget(message.ttl, payload.length);
  console.log(`target: ${target}`);

  let nonce = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]);
  let slice;
  //allocate memory
  innerPayload = new Uint8Array(payloadHash.length + NONCE_LEN);
  // assign the payloadHasht
  innerPayload.set(payloadHash, NONCE_LEN);

  do {
    nonce = incrementNonce(nonce);

    // assign the new nonce
    innerPayload.set(nonce, 0);
    sha512 = crypto.createHash("sha512");
    sha512.update(innerPayload);
    innerPayloadHash = sha512.digest();
    slice = new Uint8Array(innerPayloadHash).slice(0, 8);
  } while (greaterThan(slice, target));

  console.log(`validHashFound: ${slice} with nonce: ${nonce}`);
  console.log(`TARGET: ${target}`);

  return nonce;
};

const verifyPoW = (message, nonce) => {
  // You will be implementing this function

  // This function should take a message and nonce and verify that the nonce
  // is valid, i.e. that the leading 8 bytes of the hash is below the target

  console.log("===============");
  const payload =
    message.ttl +
    message.destination +
    message.sender +
    message.timestamp +
    message.content;
  const target = calcTarget(message.ttl, payload.length);

  let sha512 = crypto.createHash("sha512");
  sha512.update(payload);
  const payloadHash = sha512.digest();
  sha512 = crypto.createHash("sha512");

  let innerPayload = new Uint8Array(payloadHash.length + NONCE_LEN);

  innerPayload.set(payloadHash, NONCE_LEN);
  innerPayload.set(nonce, 0);
  sha512.update(innerPayload);

  const hash = new Uint8Array(sha512.digest()).slice(0, 8);
  return !greaterThan(hash, target);
};

const server = new StorageServer();
const client1 = new Client("Alice", server);
const client2 = new Client("Bobando", server);
client1.sendMessage(client2, "Hey Bobando");
