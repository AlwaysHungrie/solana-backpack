'use client'
import dynamic from 'next/dynamic'
import useInBrowserWalletStore from '@/stores/inbrowserWalletStore'
import WalletActions from './walletActions'
import { HiClipboard } from 'react-icons/hi2'

const formatAddress = (address: string) => {
  return address.slice(0, 4) + '...' + address.slice(-4)
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}

export default function InBrowserWallet() {
  const { keypair, balance } = useInBrowserWalletStore()

  return (
    <div className="flex flex-col rounded-lg w-full max-w-md border border-gray-200">
      <div className="flex items-center px-4 py-2">
        <p>{formatAddress(keypair?.publicKey.toBase58() ?? '')}</p>
        <HiClipboard
          className="w-4 h-4 cursor-pointer ml-1 hover:text-gray-500"
          onClick={() => copyToClipboard(keypair?.publicKey.toBase58() ?? '')}
        />
        <p className="ml-auto font-bold">{balance} SOL</p>
      </div>
      <div className="flex items-center px-4 pb-2 text-xs text-gray-500 font-bold">
        In-Browser Wallet - only for Devnet
      </div>

      <div className="flex p-2 bg-gray-100 rounded-b-lg">
        <WalletActions />
      </div>
    </div>
  )
}
