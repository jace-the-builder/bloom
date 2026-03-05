'use client'

import { useState } from 'react'
import { Flower } from '@/lib/supabase'

type Phase = 'closed' | 'opening' | 'open'

type Props = {
  flower: Flower
  onClose: () => void
}

export default function EnvelopeOverlay({ flower, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('closed')

  function handleEnvelopeTap() {
    if (phase !== 'closed') return
    setPhase('opening')
    setTimeout(() => setPhase('open'), 520)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/*
        Container — paddingTop creates the space the note card slides up into.
        Stop propagation so tapping envelope/card doesn't close the overlay.
      */}
      <div
        className="relative w-[280px]"
        style={{ paddingTop: '200px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Note card (slides up from inside the envelope) ── */}
        <div
          className="absolute inset-x-0 top-0 rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl"
          style={{
            opacity:    phase === 'open' ? 1 : 0,
            transform:  phase === 'open' ? 'translateY(0)' : 'translateY(160px)',
            transition: 'opacity 0.4s ease 0.15s, transform 0.5s ease 0.15s',
            zIndex:     phase === 'open' ? 20 : 0,
          }}
        >
          {/* Small flower thumbnail */}
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 overflow-hidden">
              <img
                src={flower.flower_image_url}
                alt={`${flower.contributor_name}'s flower`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          {/* Mantra */}
          <p
            className="mb-3 text-[22px] leading-snug text-[#333]"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            &ldquo;{flower.mantra}&rdquo;
          </p>
          {/* Name */}
          <p
            className="text-right text-[17px] text-[#666]"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            — {flower.contributor_name}
          </p>
        </div>

        {/* ── Envelope body ── */}
        <div
          className="relative w-full rounded-xl shadow-2xl"
          style={{
            height: '200px',
            backgroundColor: '#FDF6EE',
            border: '1.5px solid #f5d0c0',
            cursor: phase === 'closed' ? 'pointer' : 'default',
          }}
          onClick={handleEnvelopeTap}
        >
          {/* Decorative side + bottom flap triangles (SVG) */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 280 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="0,0 0,200 140,100"   fill="#EDD8C6" opacity="0.55" />
            <polygon points="280,0 280,200 140,100" fill="#E8D0BB" opacity="0.55" />
            <polygon points="0,200 280,200 140,100" fill="#E2C8B3" opacity="0.65" />
          </svg>

          {/* Top flap — folds up on open via scaleY */}
          <div
            className="absolute inset-x-0 top-0 origin-top"
            style={{
              height:      '100px',
              background:  '#EDD8C6',
              clipPath:    'polygon(0 0, 100% 0, 50% 100%)',
              transform:   phase !== 'closed' ? 'scaleY(0)' : 'scaleY(1)',
              transition:  'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Wax seal — flower drawing */}
          <div
            className="absolute overflow-hidden"
            style={{
              width:      '68px',
              height:     '68px',
              left:       '50%',
              top:        '50%',
              transform:  `translate(-50%, -50%) scale(${phase === 'closed' ? 1 : 0.6})`,
              opacity:    phase === 'closed' ? 1 : 0,
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <img
              src={flower.flower_image_url}
              alt="wax seal"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Hint */}
      <p
        className="mt-5 text-[14px] text-white/70"
        style={{ fontFamily: 'var(--font-biro)' }}
      >
        {phase === 'closed' ? 'tap to open' : phase === 'open' ? 'tap × to close' : ''}
      </p>
    </div>
  )
}
