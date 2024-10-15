const crypto = require('crypto');

class Transaction {
  constructor(fromAddress, toAddress, amount, lockUntil = 0) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.lockUntil = lockUntil; // The timestamp until which this transaction is locked (0 means no lock)
    this.timestamp = Date.now(); // Timestamp of the transaction creation
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

    // Check if the transaction is time-locked
    if (transaction.lockUntil > Date.now()) {
      throw new Error(`Transaction is time-locked until ${new Date(transaction.lockUntil).toLocaleString()}`);
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

// Attempt the first transaction with a time lock (lock for 5 seconds)
const lockUntilTime = Date.now() + 5 * 1000; // Lock for 5 seconds
console.log(`\nAttempting a transaction of 50 coins from address1 to address2, locked until ${new Date(lockUntilTime).toLocaleString()}...`);
try {
  myCoin.addTransaction(new Transaction('address1', 'address2', 50, lockUntilTime));
} catch (error) {
  console.log('Error during transaction:', error.message);
}

// Attempt a second transaction before the first one is unlocked
console.log('\nAttempting another transaction of 50 coins from address1 to address3 before the lock expires...');
try {
  myCoin.addTransaction(new Transaction('address1', 'address3', 50));
  console.log('Second transaction added successfully (unexpected).');
} catch (error) {
  console.log('Error during second transaction (double-spending prevention):', error.message);
}

// Wait for 5 seconds to allow the lock to expire, then retry the first transaction
setTimeout(() => {
  try {
    console.log('\nRetrying the transaction from address1 to address2 after lock period expires...');
    myCoin.addTransaction(new Transaction('address1', 'address2', 50));
    console.log('Transaction added successfully.');
    
    console.log('Starting the miner to confirm the transaction...');
    myCoin.minePendingTransactions('miner-address');

    console.log(`Balance of address1: ${myCoin.getBalanceOfAddress('address1')}`);
    console.log(`Balance of address2: ${myCoin.getBalanceOfAddress('address2')}`);
    console.log(`Balance of address3: ${myCoin.getBalanceOfAddress('address3')}`);
    console.log(`Balance of miner: ${myCoin.getBalanceOfAddress('miner-address')}`);
  } catch (error) {
    console.log('Error during retry:', error.message);
  }
}, 6 * 1000); // Wait for the lock time (5 seconds) + 1 second for processing
