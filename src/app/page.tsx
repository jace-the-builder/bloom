'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Event, getAllEvents } from '@/lib/supabase'
import BouquetView from '@/components/BouquetView'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Homepage() {
  const [events,          setEvents]          = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [dropdownOpen,    setDropdownOpen]    = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllEvents().then(evs => {
      setEvents(evs)
      if (evs.length > 0) setSelectedEventId(evs[0].id)
    })
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedEvent = events.find(e => e.id === selectedEventId) ?? null

  return (
    <main className="mx-auto flex w-full max-w-[393px] flex-col bg-[#FDF6EE] px-[25px] pt-8 pb-10">
      {/* Logo */}
      <div className="mb-4 flex justify-center">
        <Image
          src="/images/logo.png"
          alt="Bloom"
          width={120}
          height={62}
          priority
        />
      </div>

      {/* Event dropdown pill */}
      <div className="mb-5 flex justify-center" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-3 whitespace-nowrap rounded-full border border-[#E8DDD0] bg-[#FFF8F0] px-6 py-1.5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]"
          >
            <span className="text-[14px] text-[#333]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {selectedEvent
                ? `${selectedEvent.name} · ${formatDate(selectedEvent.date)}`
                : events.length === 0
                ? 'No events yet'
                : 'Loading…'}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            >
              <path d="M6 9L12 15L18 9" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {dropdownOpen && events.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl bg-white shadow-lg">
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedEventId(ev.id); setDropdownOpen(false) }}
                  className="block w-full px-5 py-3 text-left text-[14px] text-[#333] hover:bg-[#FFF8F0]"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                >
                  {ev.name} · {formatDate(ev.date)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Greeting */}
      <div
        className="mb-5 mx-auto w-fit"
        style={{ fontFamily: 'var(--font-biro)', transform: 'translateX(-20px)' }}
      >
        <p className="text-[40px] leading-snug text-[#333]">hello there</p>
        <p className="text-[40px] leading-snug text-[#333]">nice to meet you.</p>
      </div>

      {/* Bouquet display */}
      <div className="mb-5">
        {selectedEventId ? (
          <BouquetView eventId={selectedEventId} />
        ) : (
          <div className="w-full rounded-2xl bg-[#FDF6EE]" style={{ aspectRatio: '357 / 439' }} />
        )}
      </div>

      {/* Leave a flower button */}
      <Link
        href={selectedEventId ? `/draw?eventId=${selectedEventId}` : '/draw'}
        className="mb-5 flex w-full items-center justify-center px-8 py-3 text-center shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor: '#ffcbbf',
          fontFamily:      'var(--font-chunky)',
          fontSize:        '24px',
          color:           '#ffffff',
          borderRadius:    '40px 32px 36px 44px / 36px 40px 32px 38px',
        }}
      >
        Leave a flower
      </Link>

      {/* See today's bloom */}
      <div className="flex justify-center">
        <Link href={selectedEventId ? `/bouquet?eventId=${selectedEventId}` : '/bouquet'} className="flex items-center gap-2">
          <span
            className="text-[14px] text-[#333] underline"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            See today&apos;s bloom
          </span>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M1 7H19M13 1L19 7L13 13" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </main>
  )
}
