'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Flower } from '@/lib/supabase'
import EnvelopeOverlay from './EnvelopeOverlay'

type Props = {
  eventId: string
  highlightFlowerId?: string
}

// ─── SVG coordinate space ─────────────────────────────────────────────────────

const W = 357  // matches container px at max-width

function getH(n: number): number {
  if (n <= 10) return 439
  if (n <= 25) return 460
  return 490
}

// ribbonY is the vertical centre of the ribbon grip point
const RIBBON_PCT = 0.62  // fraction of H

// ─── Flower sizing ────────────────────────────────────────────────────────────

function getFlowerSize(n: number): number {
  if (n <= 10) return 80
  if (n <= 25) return 60
  return 44
}

const TAP_MIN = 44

// ─── Layout ───────────────────────────────────────────────────────────────────
//
// Flower head positions are derived from fixed fan angles radiating UPWARD
// from the ribbon centre (ribbonX, ribbonY). All stems are the same length.

interface LayoutPos { x: number; y: number }

const STEM_PX    = 180                      // stem length in SVG px
const MAX_FAN    = 35 * Math.PI / 180       // ±35° from vertical

function computeLayout(n: number, H: number): LayoutPos[] {
  if (n === 0) return []
  const ribbonY = H * RIBBON_PCT
  return Array.from({ length: n }, (_, i) => {
    const angle = n === 1 ? 0 : -MAX_FAN + (2 * MAX_FAN * i) / (n - 1)
    // Flower head is ABOVE the ribbon: y decreases going up
    const svgX = W / 2 + STEM_PX * Math.sin(angle)
    const svgY = ribbonY - STEM_PX * Math.cos(angle)
    return { x: (svgX / W) * 100, y: (svgY / H) * 100 }
  })
}

// Offsets for the tight bundle below the ribbon (within ±2px of centre)
const BUNDLE_OFFSETS = [-2, -1, 0, 1, 2]
const BUNDLE_LEN     = 32  // px straight down

// ─── Component ────────────────────────────────────────────────────────────────

export default function BouquetView({ eventId, highlightFlowerId }: Props) {
  const [flowers,  setFlowers]  = useState<Flower[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Flower | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('flowers')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setFlowers(data)
        setLoading(false)
      })

    const channel = supabase
      .channel(`bouquet-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'flowers', filter: `event_id=eq.${eventId}` },
        payload => setFlowers(prev => [...prev, payload.new as Flower]),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const n      = flowers.length
  const H      = getH(n)
  const sz     = getFlowerSize(n)
  const tap    = Math.max(TAP_MIN, sz)
  const offset = (tap - sz) / 2
  const layout = useMemo(() => computeLayout(n, H), [n, H])

  const ribbonY = H * RIBBON_PCT

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return <div className="w-full rounded-2xl bg-[#FDF6EE]" style={{ aspectRatio: `${W} / ${getH(0)}` }} />
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (n === 0) {
    const H0      = getH(0)
    const rib0    = H0 * RIBBON_PCT
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#FDF6EE]"
        style={{ aspectRatio: `${W} / ${H0}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H0}`}
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {/* Single fan stem going straight up from ribbon */}
          <line
            x1={W / 2} y1={rib0}
            x2={W / 2} y2={H0 * 0.08}
            stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
          />
          {/* Tight bundle going straight down from ribbon */}
          {BUNDLE_OFFSETS.map(dx => (
            <line
              key={dx}
              x1={W / 2 + dx} y1={rib0}
              x2={W / 2 + dx} y2={rib0 + BUNDLE_LEN}
              stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Ribbon sits on top, covering the join point */}
        <img
          src="/images/ribbon.png"
          alt="" aria-hidden="true"
          className="pointer-events-none absolute left-1/2"
          style={{ top: `${RIBBON_PCT * 100}%`, transform: 'translate(-50%, -60%)', width: '90px', zIndex: 2 }}
        />
        <div className="absolute inset-0 flex items-start justify-center" style={{ paddingTop: '18%' }}>
          <p className="text-[15px] text-[#aaa]" style={{ fontFamily: 'var(--font-biro)' }}>
            Be the first to leave a flower!
          </p>
        </div>
      </div>
    )
  }

  // ── Bouquet ───────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#FDF6EE]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {/* ── Stems SVG — behind ribbon and flowers (z-index 0) ── */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {/* Fan stems: FROM ribbon centre UPWARD to each flower head */}
          {flowers.map((flower, i) => {
            const pos = layout[i]
            if (!pos) return null
            return (
              <line
                key={flower.id}
                x1={W / 2}           y1={ribbonY}
                x2={(pos.x / 100) * W} y2={(pos.y / 100) * H}
                stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
              />
            )
          })}

          {/* Tight bundle: 4 lines going straight down ~30px below ribbon */}
          {BUNDLE_OFFSETS.map(dx => (
            <line
              key={dx}
              x1={W / 2 + dx} y1={ribbonY}
              x2={W / 2 + dx} y2={ribbonY + BUNDLE_LEN}
              stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
            />
          ))}
        </svg>

        {/* ── Ribbon image — on top of stems, behind flowers (z-index 2) ── */}
        <img
          src="/images/ribbon.png"
          alt="" aria-hidden="true"
          className="pointer-events-none absolute left-1/2"
          style={{
            top:       `${RIBBON_PCT * 100}%`,
            transform: 'translate(-50%, -50%)',
            width:     '90px',
            zIndex:    2,
          }}
        />

        {/* ── Flower heads — on top of everything (z-index 3+) ── */}
        {flowers.map((flower, i) => {
          const pos = layout[i]
          if (!pos) return null
          const isHighlighted = flower.id === highlightFlowerId
          return (
            <button
              key={flower.id}
              onClick={() => setSelected(flower)}
              className="absolute transition-transform active:scale-90"
              style={{
                width:     `${tap}px`,
                height:    `${tap}px`,
                left:      `${pos.x}%`,
                top:       `${pos.y}%`,
                transform: `translate(-50%, -50%) rotate(${flower.bouquet_rotation ?? 0}deg)${isHighlighted ? ' scale(1.2)' : ''}`,
                zIndex:    isHighlighted ? 10 : 3,
              }}
              aria-label={`${flower.contributor_name}'s flower`}
            >
              <div
                className="overflow-hidden rounded-full"
                style={{ width: sz, height: sz, margin: offset }}
              >
                <img
                  src={flower.flower_image_url}
                  alt={`${flower.contributor_name}'s flower`}
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <EnvelopeOverlay flower={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
