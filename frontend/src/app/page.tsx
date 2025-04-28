'use client'

import dynamic from 'next/dynamic'

export default function Home() {
  const InBrowserWallet = dynamic(
    async () => (await import('@/components/inbrowserWallet/inbrowserWallet')).default,
    {
      ssr: false,
    }
  )
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <InBrowserWallet />
    </div>
  )
}
