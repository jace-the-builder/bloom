'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getMostRecentEvent } from '@/lib/supabase'

export default function SignPage() {
  const [name,         setName]         = useState('')
  const [mantra,       setMantra]       = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [flowerDataUrl, setFlowerDataUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('flowerDrawing')
    if (!saved) router.replace('/draw')
    else setFlowerDataUrl(saved)
  }, [router])

  async function handleSubmit() {
    if (!name.trim() || !mantra.trim() || !flowerDataUrl || submitting) return
    setSubmitting(true)

    try {
      const event = await getMostRecentEvent()
      if (!event) throw new Error('No events found')

      // Convert dataURL → blob
      const res  = await fetch(flowerDataUrl)
      const blob = await res.blob()
      const filename = `${crypto.randomUUID()}.png`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('flowers')
        .upload(filename, blob, { contentType: 'image/png' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('flowers')
        .getPublicUrl(filename)

      // Bouquet fan: flowers radiate upward from the bottom-centre base.
      // angle is measured from vertical (0 = straight up), spread ±40°.
      const fanAngle  = (Math.random() - 0.5) * (Math.PI * 80 / 180)  // ±40° in radians
      const stemLen   = 240 + Math.random() * 80                       // 240–320 px in the 357×439 space
      const x = Math.max(12, Math.min(88, 50 + (Math.sin(fanAngle) * stemLen / 357) * 100))
      const y = Math.max(8,  Math.min(50, 92 - (Math.cos(fanAngle) * stemLen / 439) * 100))

      const { data: flower, error: dbError } = await supabase
        .from('flowers')
        .insert({
          event_id:           event.id,
          contributor_name:   name.trim(),
          mantra:             mantra.trim(),
          flower_image_url:   publicUrl,
          bouquet_position_x: x,
          bouquet_position_y: y,
          bouquet_rotation:   (Math.random() - 0.5) * 40,
          stem_variant:       Math.ceil(Math.random() * 8),
        })
        .select()
        .single()
      if (dbError) throw dbError

      sessionStorage.setItem('submittedFlower', JSON.stringify(flower))
      router.push('/added')
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  const canSubmit = !!name.trim() && !!mantra.trim() && !submitting

  return (
    <main
      className="mx-auto flex w-full max-w-[393px] flex-col bg-[#FDF6EE] px-[25px] pt-8 pb-8"
      style={{ minHeight: '100dvh' }}
    >
      {/* Logo */}
      <div className="mb-2 flex flex-col items-center">
        <Image src="/images/logo.png" alt="Bloom" width={120} height={62} priority />
      </div>

      {/* Back + Pagination */}
      <div className="mb-5 flex items-center justify-between">
        <Link href="/draw" className="flex items-center gap-1.5">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M19 7H1M7 1L1 7L7 13" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] text-[#333] underline" style={{ fontFamily: 'var(--font-biro)' }}>
            Back
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
          <div className="h-2 w-6 rounded-full bg-[#ffcbbf]" />
          <div className="h-2 w-2 rounded-full bg-[#ffcbbf] opacity-40" />
        </div>
      </div>

      {/* Header: title + flower thumbnail */}
      <div className="mb-6 flex items-start gap-4">
        <p
          className="flex-1 text-[32px] leading-tight text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Leave me something to take away
        </p>
        {flowerDataUrl && (
          <div className="relative mt-1 h-20 w-20 flex-shrink-0 overflow-visible">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-dashed border-[#ffcbbf] bg-white">
              <img src={flowerDataUrl} alt="Your flower" className="h-full w-full object-cover" />
            </div>
            <p
              className="absolute -bottom-4 right-0 rotate-[-6deg] whitespace-nowrap text-[9px] text-[#555]"
              style={{ fontFamily: 'var(--font-biro)' }}
            >
              thank you for the flower!
            </p>
          </div>
        )}
      </div>

      {/* Name field */}
      <div className="mb-6">
        <label
          className="mb-1 block text-[18px] text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Let's be friends!"
          className="w-full rounded-t border-b-2 border-[#ffcbbf] bg-white px-4 py-3 text-[16px] text-[#333] placeholder:italic placeholder:text-black/20 focus:outline-none"
        />
      </div>

      {/* Mantra field */}
      <div className="mb-8">
        <label
          className="mb-1 block text-[18px] text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          A mantra you live by
        </label>
        <textarea
          value={mantra}
          onChange={e => setMantra(e.target.value)}
          placeholder="Share a sentence or two — something you believe in, a piece of advice, a way of seeing the world..."
          rows={5}
          className="w-full resize-none rounded-t border-b-2 border-[#ffcbbf] bg-white px-4 py-3 text-[16px] text-[#333] placeholder:italic placeholder:text-black/20 focus:outline-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-auto w-full py-3 text-center text-[24px] text-white transition-opacity"
        style={{
          fontFamily:      'var(--font-chunky)',
          backgroundColor: '#ffcbbf',
          borderRadius:    '40px 32px 36px 44px / 36px 40px 32px 38px',
          opacity:         canSubmit ? 1 : 0.4,
        }}
      >
        {submitting ? 'Adding to the bouquet...' : 'Submit'}
      </button>
    </main>
  )
}
