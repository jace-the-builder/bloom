'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Flower } from '@/lib/supabase'
import BouquetView from '@/components/BouquetView'

export default function AddedPage() {
  const [flower, setFlower] = useState<Flower | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('submittedFlower')
    if (saved) setFlower(JSON.parse(saved))
  }, [])

  const name = flower?.contributor_name ?? '...'

  return (
    <main className="mx-auto w-full max-w-[393px] bg-[#FDF6EE]">
      {/* Logo */}
      <div className="flex flex-col items-center pt-8 pb-2">
        <Image src="/images/logo.png" alt="Bloom" width={120} height={62} priority />
      </div>

      {/* Pagination dots — step 3 */}
      <div className="mb-5 flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
        <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
        <div className="h-2 w-6 rounded-full bg-[#ffcbbf]" />
      </div>

      {/* Thank you */}
      <div className="px-[25px] mb-1 text-center">
        <p
          className="text-[40px] leading-tight text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Thank you,<br />{name}
        </p>
      </div>

      {/* Subtitle */}
      <p
        className="px-[25px] mb-4 text-center text-[16px] text-[#333]"
        style={{ fontFamily: 'var(--font-biro)' }}
      >
        your flower is now part of something bigger &lt;3
      </p>

      {/* Bouquet */}
      <div className="px-[18px] mb-3">
        {flower?.event_id ? (
          <BouquetView eventId={flower.event_id} highlightFlowerId={flower.id} />
        ) : (
          <div className="w-full rounded-2xl bg-[#FDF6EE]" style={{ aspectRatio: '357 / 439' }} />
        )}
      </div>

      {/* Hint */}
      <p
        className="px-[25px] text-center text-[12px] text-[#333] mb-5"
        style={{ fontFamily: 'var(--font-biro)' }}
      >
        Click on the flowers to see what others have written! :)
      </p>

      {/* Return Home */}
      <div className="flex justify-center pb-10">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-[14px] text-[#333] underline"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            Return Home
          </span>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M1 7H19M13 1L19 7L13 13" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </main>
  )
}
