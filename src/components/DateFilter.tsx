'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'

export type DateFilterOption = 'hoje' | 'semana' | '14dias' | '30dias' | 'personalizado'

interface DateFilterProps {
  value: DateFilterOption
  onChange: (value: DateFilterOption) => void
  onCustomDateChange?: (startDate: string, endDate: string) => void
}

export default function DateFilter({ value, onChange, onCustomDateChange }: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const options = [
    { value: 'hoje' as DateFilterOption, label: 'Hoje' },
    { value: 'semana' as DateFilterOption, label: 'Esta Semana' },
    { value: '14dias' as DateFilterOption, label: '14 Dias' },
    { value: '30dias' as DateFilterOption, label: '30 Dias' },
    { value: 'personalizado' as DateFilterOption, label: 'Personalizado' },
  ]

  const handleChange = (newValue: DateFilterOption) => {
    onChange(newValue)
    if (newValue === 'personalizado') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
    }
  }

  const handleCustomApply = () => {
    if (startDate && endDate && onCustomDateChange) {
      onCustomDateChange(startDate, endDate)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-[#FFD700] text-zinc-900'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showCustom && value === 'personalizado' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Calendar className="w-4 h-4" />
            <span>Selecione o período</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!startDate || !endDate}
            className="w-full px-4 py-2 bg-[#FFD700] text-zinc-900 rounded-lg font-medium hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar Filtro
          </button>
        </div>
      )}
    </div>
  )
}
