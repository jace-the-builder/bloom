'use client'

import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [name,     setName]     = useState('')
  const [date,     setDate]     = useState('')
  const [creating, setCreating] = useState(false)
  const [message,  setMessage]  = useState('')

  async function handleCreate() {
    if (!name.trim() || !date || creating) return
    setCreating(true)
    setMessage('')

    const { error } = await supabase
      .from('events')
      .insert({ name: name.trim(), date })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Event "${name.trim()}" created!`)
      setName('')
      setDate('')
    }
    setCreating(false)
  }

  const canCreate = !!name.trim() && !!date && !creating

  return (
    <main
      className="mx-auto flex w-full max-w-[393px] flex-col bg-[#FDF6EE] px-[25px] pt-8 pb-8"
      style={{ minHeight: '100dvh' }}
    >
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Image src="/images/logo.png" alt="Bloom" width={120} height={62} priority />
      </div>

      <h1
        className="mb-6 text-[32px] leading-tight text-[#333]"
        style={{ fontFamily: 'var(--font-biro)' }}
      >
        Create Event
      </h1>

      {/* Event name */}
      <div className="mb-6">
        <label
          className="mb-1 block text-[18px] text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Event Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Claude Code Night"
          className="w-full rounded-t border-b-2 border-[#ffcbbf] bg-white px-4 py-3 text-[16px] text-[#333] placeholder:italic placeholder:text-black/20 focus:outline-none"
        />
      </div>

      {/* Date */}
      <div className="mb-8">
        <label
          className="mb-1 block text-[18px] text-[#333]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-t border-b-2 border-[#ffcbbf] bg-white px-4 py-3 text-[16px] text-[#333] focus:outline-none"
        />
      </div>

      {message && (
        <p
          className="mb-4 text-[14px] text-[#555]"
          style={{ fontFamily: 'var(--font-biro)' }}
        >
          {message}
        </p>
      )}

      <button
        onClick={handleCreate}
        disabled={!canCreate}
        className="mt-auto w-full py-3 text-center text-[24px] text-white transition-opacity"
        style={{
          fontFamily:      'var(--font-chunky)',
          backgroundColor: '#ffcbbf',
          borderRadius:    '40px 32px 36px 44px / 36px 40px 32px 38px',
          opacity:         canCreate ? 1 : 0.4,
        }}
      >
        {creating ? 'Creating…' : 'Create Event'}
      </button>
    </main>
  )
}
