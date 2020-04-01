const PubNub = require("pubnub");

const credentials = {
  publishKey: "pub-c-7c7df8d5-55aa-4a24-983f-b99a779ecd93",
  subscribeKey: "sub-c-d110e330-0686-11ea-bc84-32c7c2eb6eff",
  secretKey: "sec-c-ODJlYjAxYzktYzYzMS00ODM5LTg3ODQtMDA4YzNiYTQzMWZh"
};

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN"
};

class PubSub {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.pubnub = new PubNub(credentials);
    this.subscribeToChannels();
    this.pubnub.addListener(this.listener());
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;
        const parsedMessage = JSON.parse(message);
        if (channel === CHANNELS.BLOCKCHAIN) {
          this.blockchain.replaceChain(parsedMessage);
        }
      }
    };
  }

  async subscribeToChannels() {
    await this.pubnub.subscribe({ channels: [CHANNELS.BLOCKCHAIN] });
  }

  async publish({ channel, message }) {
    await this.pubnub.unsubscribe({ channels: [CHANNELS.BLOCKCHAIN] });
    await this.pubnub.publish({ channel, message });
    await this.subscribeToChannels();
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }
}

module.exports = PubSub;
