import { Connection } from '@solana/web3.js'
import { Keypair } from '@solana/web3.js'
import { create } from 'zustand'

interface InBrowserWalletStore {
  keypair: Keypair
  connection: Connection
  balance: number

  setKeypair: (keypair?: Keypair) => void
  setConnection: (connection?: Connection) => void
  setBalance: (balance?: number) => void
}

const useInBrowserWalletStore = create<InBrowserWalletStore>((set) => ({
  keypair: Keypair.generate(),
  connection: new Connection('https://api.devnet.solana.com'),
  balance: 0,

  setKeypair: (keypair?: Keypair) => set({ keypair }),
  setConnection: (connection?: Connection) => set({ connection }),
  setBalance: (balance?: number) => set({ balance }),
}))

export default useInBrowserWalletStore
