import hashlib
import time
import random

class Block:
    def __init__(self, index, previous_hash, timestamp, data, hash, nonce=0):
        self.index = index
        self.previous_hash = previous_hash
        self.timestamp = timestamp
        self.data = data
        self.hash = hash
        self.nonce = nonce

    def __repr__(self):
        return f"Block(index={self.index}, previous_hash='{self.previous_hash}', timestamp={self.timestamp}, data='{self.data}', hash='{self.hash}', nonce={self.nonce})"

class Blockchain:
    def __init__(self):
        self.chain = []
        self.difficulty = 2  # Adjust difficulty for PoW
        self.create_genesis_block()  # Create the genesis block

    def create_genesis_block(self):
        genesis_block = Block(
            index=1,
            previous_hash='0',
            timestamp=int(time.time()),
            data="Genesis Block",
            hash='0'*64,
            nonce=0
        )
        self.chain.append(genesis_block)

    def create_block(self, nonce, previous_hash, data="Block Data"):
        block = Block(
            index=len(self.chain) + 1,
            previous_hash=previous_hash,
            timestamp=int(time.time()),
            data=data,
            hash=self.hash_block(nonce, previous_hash, data),
            nonce=nonce
        )
        self.chain.append(block)
        return block

    def hash_block(self, nonce, previous_hash, data):
        block_string = f"{nonce}{previous_hash}{data}{int(time.time())}".encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self, data="Block Data"):
        previous_block = self.chain[-1]
        previous_hash = previous_block.hash
        nonce = 0

        while True:
            hash = self.hash_block(nonce, previous_hash, data)
            if hash[:self.difficulty] == '0' * self.difficulty:  # Check if hash meets difficulty
                break
            nonce += 1

        new_block = self.create_block(nonce, previous_hash, data)
        print(f"Block mined: {new_block}")
        return new_block

    def validate_chain(self):
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            if current.previous_hash != previous.hash:
                return False
            if current.hash[:self.difficulty] != '0' * self.difficulty:
                return False

        return True

def user_driven_simulation():
    blockchain = Blockchain()
    forks = []  # To keep track of separate chains (forks)

    while True:
        print("\nCurrent Blockchain:")
        for block in blockchain.chain:
            print(block)
        
        print("\nMenu:")
        print("1. Mine a new block")
        print("2. Create a fork")
        print("3. Extend a fork")
        print("4. Resolve forks (Longest chain rule)")
        print("5. Validate blockchain")
        print("6. Exit")

        choice = input("\nEnter your choice: ")

        if choice == '1':
            data = input("Enter block data: ")
            blockchain.mine_block(data=data)

        elif choice == '2':
            # Create a new fork from the current chain
            fork = blockchain.chain[:]
            forks.append(fork)
            print(f"Fork {len(forks)} created.")

        elif choice == '3':
            # Allow the user to choose which fork to extend
            if not forks:
                print("No forks available to extend.")
                continue
            print(f"Available forks: 1 to {len(forks)}")
            fork_choice = int(input("Choose a fork to extend: ")) - 1

            if 0 <= fork_choice < len(forks):
                fork = forks[fork_choice]
                data = input("Enter data for the new block: ")
                nonce = random.randint(0, 1000)  # Simulate mining by generating a random nonce
                new_block = Blockchain().create_block(nonce, fork[-1].hash, data)
                fork.append(new_block)
                print(f"Block added to Fork {fork_choice + 1}.")
            else:
                print("Invalid fork choice.")

        elif choice == '4':
            # Apply the longest chain rule to resolve forks
            if not forks:
                print("No forks available for resolution.")
                continue
            max_length = len(blockchain.chain)
            selected_fork = blockchain.chain

            for fork in forks:
                if len(fork) > max_length:
                    max_length = len(fork)
                    selected_fork = fork

            blockchain.chain = selected_fork
            forks = []  # Clear all forks after resolution
            print("Forks resolved using the longest chain rule.")

        elif choice == '5':
            is_valid = blockchain.validate_chain()
            print(f"The blockchain is {'valid' if is_valid else 'invalid'}.")

        elif choice == '6':
            print("Exiting the simulation.")
            break

        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    user_driven_simulation()


