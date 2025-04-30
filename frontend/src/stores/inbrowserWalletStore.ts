import { Connection } from '@solana/web3.js'
import { Keypair } from '@solana/web3.js'
import { create } from 'zustand'

interface InBrowserWalletStore {
  keypair: Keypair | undefined
  connection: Connection
  balance: number | undefined

  setKeypair: (keypair?: Keypair) => void
  setConnection: (connection?: Connection) => void
  setBalance: (balance?: number) => void
}

const useInBrowserWalletStore = create<InBrowserWalletStore>((set) => ({
  keypair: undefined,
  connection: new Connection('https://api.devnet.solana.com'),
  balance: undefined,

  setKeypair: (keypair?: Keypair) => set({ keypair }),
  setConnection: (connection?: Connection) => set({ connection }),
  setBalance: (balance?: number) => set({ balance }),
}))

export default useInBrowserWalletStore
