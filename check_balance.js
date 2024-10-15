const crypto = require('crypto');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return crypto.createHash('sha256').update(
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.transactions) +
      this.nonce
    ).digest('hex');
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(Date.now(), [], "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount should be higher than 0');
    }

    const senderBalance = this.getBalanceOfAddress(transaction.fromAddress);
    if (senderBalance < transaction.amount) {
      throw new Error(`Not enough balance. Attempted to send ${transaction.amount}, but balance is ${senderBalance}`);
    }

    // Check if adding the transaction would exceed balance
    const pendingAmount = this.pendingTransactions
      .filter(tx => tx.fromAddress === transaction.fromAddress)
      .reduce((acc, tx) => acc + tx.amount, 0);

    if (pendingAmount + transaction.amount > senderBalance) {
      throw new Error(`Double spending detected! Attempted to spend ${pendingAmount + transaction.amount}, but only ${senderBalance} is available.`);
    }

    this.pendingTransactions.push(transaction);
    console.log(`Transaction added: ${JSON.stringify(transaction)}`);
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

// Example usage
const myCoin = new Blockchain();

// Mine some initial rewards to address1
console.log('\nStarting the miner...');
myCoin.minePendingTransactions('address1');  // Rewarding address1 with 100 coins

console.log(`Balance of address1: ${myCoin.getBalanceOfAddress('address1')}`);

// Valid transaction: address1 sends 50 coins to address2
console.log('\nAttempting a valid transaction of 50 coins from address1 to address2...');
myCoin.addTransaction(new Transaction('address1', 'address2', 50));

console.log('Starting the miner to confirm the transaction...');
myCoin.minePendingTransactions('miner-address');

console.log(`Balance of address1: ${myCoin.getBalanceOfAddress('address1')}`);
console.log(`Balance of address2: ${myCoin.getBalanceOfAddress('address2')}`);
console.log(`Balance of miner: ${myCoin.getBalanceOfAddress('miner-address')}`);

// Attempt a double-spending attack: address1 tries to send 70 coins twice
console.log('\nAttempting a double-spending attack...');
try {
  // Show balance before double-spending attempt
  console.log(`Balance of address1 before double-spending attempt: ${myCoin.getBalanceOfAddress('address1')}`);

  // First transaction of 70 coins, which should succeed
  console.log('Attempting to send 70 coins from address1 to address3...');
  myCoin.addTransaction(new Transaction('address1', 'address3', 70));
  console.log('First transaction of 70 coins added.');

  // Second transaction of 70 coins, which should fail due to insufficient balance
  console.log('Attempting to send another 70 coins from address1 to address4...');
  myCoin.addTransaction(new Transaction('address1', 'address4', 70));
  console.log('Second transaction of 70 coins added.');
} catch (error) {
  console.log('Error during transaction:', error.message);
}

console.log('\nBalances after attempting double spending:');
console.log(`Balance of address1: ${myCoin.getBalanceOfAddress('address1')}`);
console.log(`Balance of address3: ${myCoin.getBalanceOfAddress('address3')}`);
console.log(`Balance of address4: ${myCoin.getBalanceOfAddress('address4')}`);
console.log(`Balance of miner: ${myCoin.getBalanceOfAddress('miner-address')}`);
console.log(`Is blockchain valid? ${myCoin.isChainValid()}`);
