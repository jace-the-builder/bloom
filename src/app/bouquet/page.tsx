'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Event, getMostRecentEvent, supabase } from '@/lib/supabase'
import BouquetView from '@/components/BouquetView'

function BouquetContent() {
  const [event,   setEvent]   = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('eventId')

  useEffect(() => {
    if (eventIdParam) {
      supabase
        .from('events')
        .select('*')
        .eq('id', eventIdParam)
        .single()
        .then(({ data }) => {
          setEvent(data)
          setLoading(false)
        })
    } else {
      getMostRecentEvent().then(ev => {
        setEvent(ev)
        setLoading(false)
      })
    }
  }, [eventIdParam])

  return (
    <main className="mx-auto w-full max-w-[393px] bg-[#FDF6EE]">
      {/* Logo */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <Image src="/images/logo.png" alt="Bloom" width={120} height={62} priority />
      </div>

      {/* Heading */}
      <div className="px-[25px] mb-1 text-center">
        <p
          className="text-[40px] leading-tight text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Today&apos;s bloom
        </p>
        {event && (
          <p
            className="text-[16px] text-[#555]"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            {event.name}
          </p>
        )}
      </div>

      {/* Bouquet or empty states */}
      <div className="px-[18px] mt-4 mb-3">
        {loading ? (
          <div className="w-full rounded-2xl bg-[#FDF6EE]" style={{ aspectRatio: '357 / 439' }} />
        ) : event ? (
          <BouquetView eventId={event.id} />
        ) : (
          <div className="py-16 text-center">
            <p
              className="text-[18px] text-[#999]"
              style={{ fontFamily: 'var(--font-biro)' }}
            >
              No events yet.
            </p>
          </div>
        )}
      </div>

      {/* Hint */}
      <p
        className="px-[25px] text-center text-[12px] text-[#333] mb-5"
        style={{ fontFamily: 'var(--font-biro)' }}
      >
        tap any flower to see what they&apos;ve written :)
      </p>

      {/* Back home */}
      <div className="flex justify-center pb-10">
        <Link href="/" className="flex items-center gap-2">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M19 7H1M7 1L1 7L7 13" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className="text-[14px] text-[#333] underline"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            Back to home
          </span>
        </Link>
      </div>
    </main>
  )
}

export default function BouquetPage() {
  return (
    <Suspense>
      <BouquetContent />
    </Suspense>
  )
}
