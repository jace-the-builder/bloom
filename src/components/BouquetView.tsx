'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase, Flower } from '@/lib/supabase'
import EnvelopeOverlay from './EnvelopeOverlay'

type Props = {
  eventId: string
  highlightFlowerId?: string
  fillHeight?: boolean
}

// ─── SVG coordinate space ─────────────────────────────────────────────────────

const W = 357  // matches container px at max-width

function getH(n: number): number {
  if (n <= 10) return 439
  if (n <= 25) return 460
  return 490
}

const RIBBON_PCT = 0.62

// ─── Flower sizing ────────────────────────────────────────────────────────────

function getFlowerSize(n: number): number {
  if (n <= 10) return 80
  if (n <= 25) return 60
  return 44
}

const TAP_MIN = 44

// ─── Layout ───────────────────────────────────────────────────────────────────

interface LayoutPos { x: number; y: number }

const STEM_PX = 180
const MAX_FAN = 35 * Math.PI / 180

function computeLayout(n: number, H: number): LayoutPos[] {
  if (n === 0) return []
  const ribbonY = H * RIBBON_PCT
  return Array.from({ length: n }, (_, i) => {
    const angle = n === 1 ? 0 : -MAX_FAN + (2 * MAX_FAN * i) / (n - 1)
    const svgX = W / 2 + STEM_PX * Math.sin(angle)
    const svgY = ribbonY - STEM_PX * Math.cos(angle)
    return { x: (svgX / W) * 100, y: (svgY / H) * 100 }
  })
}

const BUNDLE_OFFSETS = [-2, -1, 0, 1, 2]
const BUNDLE_LEN     = 32

// ─── Wind interaction constants ───────────────────────────────────────────────

const SWAY_RADIUS = 35  // percent of container — flowers within this distance sway
const MAX_SWAY    = 8   // max degrees of sway
const ACTIVE_R    = 15  // percent — closest flower within this is "active"

// ─── Component ────────────────────────────────────────────────────────────────

export default function BouquetView({ eventId, highlightFlowerId, fillHeight }: Props) {
  const [flowers,  setFlowers]  = useState<Flower[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Flower | null>(null)

  // Wind / touch interaction
  const [swayAngles,     setSwayAngles]     = useState<Record<string, number>>({})
  const [activeFlowerId, setActiveFlowerId] = useState<string | null>(null)
  const [isTouching,     setIsTouching]     = useState(false)
  const [hintVisible,    setHintVisible]    = useState(false)

  // Refs for stable event handler closures
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number | null>(null)
  const activeIdRef  = useRef<string | null>(null)
  const flowersRef   = useRef<Flower[]>([])
  const layoutRef    = useRef<LayoutPos[]>([])

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

  // Keep refs in sync with latest render values
  useEffect(() => { flowersRef.current = flowers }, [flowers])
  useEffect(() => { layoutRef.current  = layout  }, [layout])

  // One-time "drag to explore" hint — fades in then out
  useEffect(() => {
    if (n === 0) return
    if (sessionStorage.getItem('bouquetHintShown')) return
    const show   = setTimeout(() => setHintVisible(true),  200)
    const hide   = setTimeout(() => setHintVisible(false), 2500)
    const finish = setTimeout(() => sessionStorage.setItem('bouquetHintShown', '1'), 3200)
    return () => { clearTimeout(show); clearTimeout(hide); clearTimeout(finish) }
  }, [n])

  // Compute sway angles and active flower from touch position
  const updateSway = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect      = container.getBoundingClientRect()
    const touchXPct = ((clientX - rect.left) / rect.width)  * 100
    const touchYPct = ((clientY - rect.top)  / rect.height) * 100

    let closestDist = Infinity
    let closestId: string | null = null
    const newAngles: Record<string, number> = {}

    flowersRef.current.forEach((flower, i) => {
      const pos = layoutRef.current[i]
      if (!pos) return
      const dx   = touchXPct - pos.x
      const dy   = touchYPct - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < SWAY_RADIUS) {
        const strength = 1 - dist / SWAY_RADIUS
        // Sway direction: right of finger = clockwise, left = counter-clockwise
        newAngles[flower.id] = MAX_SWAY * strength * Math.sign(dx)
      }
      if (dist < closestDist) {
        closestDist = dist
        closestId   = flower.id
      }
    })

    const newActiveId = closestDist < ACTIVE_R ? closestId : null
    activeIdRef.current = newActiveId
    setSwayAngles(newAngles)
    setActiveFlowerId(newActiveId)
  }, [])

  // Native touch listeners (passive: false so preventDefault works)
  // n is in deps so the effect re-runs once the bouquet div actually renders
  // (containerRef.current is null during the loading phase)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    console.log('[BouquetView] attaching touch listeners to', container)

    const onStart = (e: TouchEvent) => {
      e.preventDefault()  // prevent synthetic click
      console.log('[BouquetView] touchstart', e.touches[0].clientX, e.touches[0].clientY)
      setIsTouching(true)
      const t = e.touches[0]
      updateSway(t.clientX, t.clientY)
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      console.log('[BouquetView] touchmove', e.touches[0].clientX, e.touches[0].clientY)
      const t  = e.touches[0]
      const cx = t.clientX
      const cy = t.clientY
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => updateSway(cx, cy))
    }

    const onEnd = () => {
      console.log('[BouquetView] touchend, activeId:', activeIdRef.current)
      setIsTouching(false)
      setSwayAngles({})
      const flower = flowersRef.current.find(f => f.id === activeIdRef.current)
      activeIdRef.current = null
      setActiveFlowerId(null)
      if (flower) setSelected(flower)
    }

    container.addEventListener('touchstart', onStart, { passive: false })
    container.addEventListener('touchmove',  onMove,  { passive: false })
    container.addEventListener('touchend',   onEnd)
    return () => {
      container.removeEventListener('touchstart', onStart)
      container.removeEventListener('touchmove',  onMove)
      container.removeEventListener('touchend',   onEnd)
    }
  }, [updateSway, n])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return <div className="w-full rounded-2xl bg-[#FDF6EE]" style={fillHeight ? { height: '100%' } : { aspectRatio: `${W} / ${getH(0)}` }} />
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (n === 0) {
    const H0   = getH(0)
    const rib0 = H0 * RIBBON_PCT
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#FDF6EE]"
        style={fillHeight ? { height: '100%' } : { aspectRatio: `${W} / ${H0}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H0}`}
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          <line
            x1={W / 2} y1={rib0}
            x2={W / 2} y2={H0 * 0.08}
            stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
          />
          {BUNDLE_OFFSETS.map(dx => (
            <line
              key={dx}
              x1={W / 2 + dx} y1={rib0}
              x2={W / 2 + dx} y2={rib0 + BUNDLE_LEN}
              stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
            />
          ))}
        </svg>
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
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl bg-[#FDF6EE]"
        style={{
          ...(fillHeight ? { height: '100%' } : { aspectRatio: `${W} / ${H}` }),
          touchAction: 'none',
        }}
      >
        {/* ── Stems SVG — behind ribbon and flowers (z-index 0) ── */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {flowers.map((flower, i) => {
            const pos = layout[i]
            if (!pos) return null
            return (
              <line
                key={flower.id}
                x1={W / 2}             y1={ribbonY}
                x2={(pos.x / 100) * W} y2={(pos.y / 100) * H}
                stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round"
              />
            )
          })}
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
          const isActive      = flower.id === activeFlowerId
          const sway          = swayAngles[flower.id] ?? 0
          const baseRot       = flower.bouquet_rotation ?? 0
          const scaleVal      = isActive ? 1.15 : isHighlighted ? 1.2 : 1
          const transition    = isTouching
            ? 'transform 0.08s ease-out'
            : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          return (
            <button
              key={flower.id}
              onClick={() => setSelected(flower)}
              className="absolute"
              style={{
                width:      `${tap}px`,
                height:     `${tap}px`,
                left:       `${pos.x}%`,
                top:        `${pos.y}%`,
                transform:  `translate(-50%, -50%) rotate(${baseRot + sway}deg) scale(${scaleVal})`,
                transition,
                zIndex:     isActive || isHighlighted ? 10 : 3,
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

        {/* ── "drag to explore" hint — one-time, fades in then out ── */}
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{
            bottom:     '42%',
            zIndex:     5,
            opacity:    hintVisible ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <span
            className="rounded-full bg-black/20 px-4 py-1.5 text-[13px] text-white backdrop-blur-sm"
            style={{ fontFamily: 'var(--font-biro)' }}
          >
            drag to explore
          </span>
        </div>
      </div>

      {selected && (
        <EnvelopeOverlay flower={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
