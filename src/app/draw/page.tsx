'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const COLORS = [
  { id: 'rose',       value: '#E8A0A0' },
  { id: 'lavender',   value: '#C5B8E8' },
  { id: 'periwinkle', value: '#B8C8E0' },
  { id: 'charcoal',   value: '#2C2C2C' },
]

const BRUSH_SIZES = [
  { id: 'sm', px: 3,  display: 14 },
  { id: 'md', px: 7,  display: 22 },
  { id: 'lg', px: 14, display: 32 },
]

export default function DrawPage() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const colorRef     = useRef(COLORS[0].value)
  const sizeRef      = useRef(BRUSH_SIZES[1].px)
  const isDrawingRef = useRef(false)
  const lastPosRef   = useRef<{ x: number; y: number } | null>(null)
  const historyRef   = useRef<ImageData[]>([])

  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [selectedSize,  setSelectedSize]  = useState(BRUSH_SIZES[1].px)
  const [hasDrawn,      setHasDrawn]      = useState(false)

  const router = useRouter()

  useEffect(() => { colorRef.current = selectedColor }, [selectedColor])
  useEffect(() => { sizeRef.current  = selectedSize  }, [selectedSize])

  // Initialise canvas
  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const size = container.offsetWidth
    const dpr  = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)
  }, [])

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
  }

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (historyRef.current.length > 50) historyRef.current.shift()
  }, [])

  // Attach canvas events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onStart = (e: MouseEvent | TouchEvent) => {
      saveHistory()
      isDrawingRef.current = true
      lastPosRef.current   = getPos(e, canvas)
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return
      if (e instanceof TouchEvent) e.preventDefault()
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.strokeStyle = colorRef.current
      ctx.lineWidth   = sizeRef.current
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      if (lastPosRef.current) {
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
      lastPosRef.current = pos
      setHasDrawn(true)
    }

    const onEnd = () => {
      isDrawingRef.current = false
      lastPosRef.current   = null
    }

    canvas.addEventListener('mousedown',  onStart)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onEnd)
    canvas.addEventListener('mouseleave', onEnd)
    canvas.addEventListener('touchstart', onStart, { passive: true })
    canvas.addEventListener('touchmove',  onMove,  { passive: false })
    canvas.addEventListener('touchend',   onEnd)

    return () => {
      canvas.removeEventListener('mousedown',  onStart)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onEnd)
      canvas.removeEventListener('mouseleave', onEnd)
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove',  onMove)
      canvas.removeEventListener('touchend',   onEnd)
    }
  }, [saveHistory])

  const handleUndo = () => {
    const canvas = canvasRef.current
    if (!canvas || historyRef.current.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const prev = historyRef.current.pop()!
    ctx.putImageData(prev, 0, 0)
    if (historyRef.current.length === 0) setHasDrawn(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    saveHistory()
    const size = canvas.width / (window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, size, size)
    setHasDrawn(false)
  }

  const handleNext = () => {
    if (!hasDrawn) return
    const canvas = canvasRef.current
    if (!canvas) return
    sessionStorage.setItem('flowerDrawing', canvas.toDataURL('image/png'))
    router.push('/sign')
  }

  return (
    <main
      className="mx-auto flex w-full max-w-[393px] flex-col overflow-hidden bg-[#FDF6EE] px-9 pt-8 pb-8"
      style={{ height: '100dvh' }}
    >
      {/* Logo */}
      <div className="mb-2 flex flex-col items-center">
        <Image src="/images/logo.png" alt="Bloom" width={120} height={62} priority />
      </div>

      {/* Back + Pagination */}
      <div className="mb-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M19 7H1M7 1L1 7L7 13" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] text-[#333] underline" style={{ fontFamily: 'var(--font-biro)' }}>
            Back
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-2 w-6 rounded-full bg-[#ffcbbf]" />
          <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
          <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-4" style={{ fontFamily: 'var(--font-biro)' }}>
        <p className="text-[36px] leading-tight text-[#333]">Draw me a flower</p>
        <p className="text-[15px] text-[#333]">anything goes.. big, small, abstract, they&apos;re all perfect!</p>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative mb-2 w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#ffcbbf] bg-white"
        style={{ aspectRatio: '1 / 1' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[16px] text-[#ffcbbf]" style={{ fontFamily: 'var(--font-biro)' }}>
              your flower goes here
            </span>
          </div>
        )}
      </div>

      {/* Undo / Clear All */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 rounded-full border border-[#ffcbbf] bg-white px-5 py-2 font-bold text-[#ffcbbf]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.37 2.63L3 13" />
          </svg>
          Undo
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-full border border-[#ffcbbf] bg-white px-5 py-2 font-bold text-[#ffcbbf]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Brush Colour + Brush Size */}
      <div className="mb-4 flex items-start justify-between">
        {/* Colour */}
        <div>
          <p className="mb-2 text-[15px] text-[#333]" style={{ fontFamily: 'var(--font-biro)' }}>
            Brush Colour
          </p>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => {
              const active = selectedColor === c.value
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.value)}
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width:   active ? '40px' : '36px',
                    height:  active ? '40px' : '36px',
                    padding: active ? '3px'  : '0',
                    border:  active ? '1.5px dashed #766262' : 'none',
                  }}
                  aria-label={`${c.id} brush colour`}
                >
                  <span
                    className="block rounded-full"
                    style={{ width: '100%', height: '100%', backgroundColor: c.value }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Size */}
        <div className="text-right">
          <p className="mb-2 text-[15px] text-[#333]" style={{ fontFamily: 'var(--font-biro)' }}>
            Brush Size
          </p>
          <div className="flex items-center justify-end gap-3">
            {BRUSH_SIZES.map((b) => {
              const active = selectedSize === b.px
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedSize(b.px)}
                  className="rounded-full transition-all"
                  style={{
                    width:           `${b.display}px`,
                    height:          `${b.display}px`,
                    backgroundColor: active ? '#444' : '#bbb',
                    outline:         active ? '2px solid #888' : 'none',
                    outlineOffset:   '2px',
                  }}
                  aria-label={`${b.id} brush`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="mt-auto w-full py-3 text-center text-[24px] text-white transition-opacity"
        style={{
          fontFamily:    'var(--font-chunky)',
          backgroundColor: '#ffcbbf',
          borderRadius:  '40px 32px 36px 44px / 36px 40px 32px 38px',
          opacity:       hasDrawn ? 1 : 0.4,
        }}
        disabled={!hasDrawn}
      >
        {hasDrawn ? 'Next →' : 'Next (draw first)'}
      </button>
    </main>
  )
}
