'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { Button } from '../ui/button'
import bs58 from 'bs58'
import { PublicKey } from '@solana/web3.js'
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import useInBrowserWalletStore from '@/stores/inbrowserWalletStore'

const PRIVATE_KEY = 'SOLANA_BACKPACK_PK'
const MESSAGE = 'Hello, Solana Backpack!'

export default function WalletActions() {
  const {
    wallets,
    connect,
    connected,
    select,
    signMessage,
    publicKey,
    disconnect,
    signTransaction,
  } = useWallet()

  const {
    keypair,
    connection,
    balance,
    setKeypair,
    setConnection,
    setBalance,
  } = useInBrowserWalletStore()

  const [loading, setLoading] = useState(true)

  const [phantomBalance, setPhantomBalance] = useState<number>()
  const updateBalanceInterval = useRef<NodeJS.Timeout>(null)
  const updatePhantomBalanceInterval = useRef<NodeJS.Timeout>(null)

  const [wallet, setWallet] = useState<Wallet>()
  const [signingLoading, setSigningLoading] = useState(false)
  const [fundingLoading, setFundingLoading] = useState(false)
  const findWallet = useCallback(() => {
    const phantomWallet = wallets.find(
      (wallet) => wallet.adapter.name === 'Phantom'
    )
    return phantomWallet || wallets[0]
  }, [wallets])

  const handleGeneratePrivateKey = useCallback(async () => {
    if (!connected || !signMessage) {
      return
    }

    try {
      setSigningLoading(true)

      const messageBytes = new TextEncoder().encode(MESSAGE)
      const signatureBytes = await signMessage(messageBytes)
      const signatureString = bs58.encode(signatureBytes)

      const keypair = Keypair.fromSecretKey(signatureBytes, {
        skipValidation: true,
      })
      setKeypair(keypair)

      localStorage.setItem(PRIVATE_KEY, signatureString)
    } catch (error) {
      console.error('Error signing message:', error)
    } finally {
      setSigningLoading(false)
    }
  }, [connected, signMessage])

  const handleFundFromPhantom = useCallback(
    async (amount: number) => {
      if (!publicKey || !connection || !keypair || !signTransaction) {
        return
      }

      try {
        setFundingLoading(true)
        const toPublicKey = new PublicKey(keypair.publicKey.toBase58())
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: toPublicKey,
            lamports,
          })
        )

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const signedTransaction = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        )

        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        )
      } catch (error) {
        console.error('Error funding from Phantom:', error)
      } finally {
        setSigningLoading(false)
      }
    },
    [publicKey, connection, signTransaction]
  )

  const handleClearKeypair = () => {
    setKeypair(undefined)
    localStorage.removeItem(PRIVATE_KEY)
    disconnect()
  }

  useEffect(() => {
    const privateKey = localStorage.getItem(PRIVATE_KEY)
    if (privateKey) {
      const privateKeyBytes = bs58.decode(privateKey)
      const keypair = Keypair.fromSecretKey(privateKeyBytes, {
        skipValidation: true,
      })
      setKeypair(keypair)
    }

    const connection = new Connection(clusterApiUrl('devnet'))
    setConnection(connection)
    const wallet = findWallet()
    if (wallet) {
      setWallet(wallet)
    }

    setLoading(false)
  }, [wallets])

  useEffect(() => {
    if (keypair && connection) {
      updateBalanceInterval.current = setInterval(async () => {
        const balance = await connection.getBalance(keypair.publicKey)
        setBalance(balance / LAMPORTS_PER_SOL)
      }, 1000)
    } else if (updateBalanceInterval.current) {
      clearInterval(updateBalanceInterval.current)
    }

    return () => {
      if (updateBalanceInterval.current) {
        clearInterval(updateBalanceInterval.current)
      }
    }
  }, [keypair, connection])

  useEffect(() => {
    if (publicKey && connection) {
      updatePhantomBalanceInterval.current = setInterval(async () => {
        const balance = await connection.getBalance(publicKey)
        setPhantomBalance(balance / LAMPORTS_PER_SOL)
      }, 1000)
    } else if (updatePhantomBalanceInterval.current) {
      clearInterval(updatePhantomBalanceInterval.current)
    }

    return () => {
      if (updatePhantomBalanceInterval.current) {
        clearInterval(updatePhantomBalanceInterval.current)
      }
    }
  }, [publicKey, connection])

  if (loading) {
    return null
  }

  if (!wallet) {
    return <div>No wallet found</div>
  }

  if (keypair) {
    return (
      <>
        <Button onClick={handleClearKeypair} size="sm">
          Clear
        </Button>
        {(!balance || balance < 1) && (
          <>
            {!phantomBalance || phantomBalance < 0.01 ? (
              <Button
                onClick={() => {
                  window.open('https://faucet.solana.com/', '_blank')
                }}
                size="sm"
              >
                Request Airdrop
              </Button>
            ) : (
              <Button
                onClick={() => {
                  handleFundFromPhantom(1 - (balance ?? 0))
                }}
                disabled={fundingLoading}
                size="sm"
              >
                {fundingLoading ? 'Funding...' : 'Fund from Phantom'}
              </Button>
            )}
          </>
        )}
      </>
    )
  }

  if (!connected) {
    return (
      <Button
        onClick={async () => {
          if (!wallet || !wallet.adapter.name) {
            return
          }
          select(wallet.adapter.name)
          await connect()
        }}
        className="cursor-pointer"
        size="sm"
      >
        Connect with {wallet.adapter.name}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleGeneratePrivateKey}
      className="cursor-pointer"
      disabled={signingLoading}
      size="sm"
    >
      {signingLoading ? 'Signing...' : 'Generate private key'}
    </Button>
  )
}
