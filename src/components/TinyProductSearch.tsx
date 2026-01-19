'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface Product {
  id: string
  codigo: string
  nome: string
  unidade?: string
}

interface TinyProductSearchProps {
  value: string
  onChange: (sku: string, product?: Product) => void
  onProductSelect?: (product: Product) => void
  placeholder?: string
  label?: string
}

export default function TinyProductSearch({ 
  value, 
  onChange, 
  onProductSelect,
  placeholder = "Digite o SKU",
  label = "SKU do Produto"
}: TinyProductSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/tiny/produtos?pesquisa=${encodeURIComponent(query)}`)
        const data = await res.json()
        
        if (data.ok && data.produtos) {
          setResults(data.produtos.slice(0, 10)) // Limitar a 10 resultados
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)
    setShowResults(true)
  }

  const handleSelectProduct = (product: Product) => {
    setQuery(product.codigo)
    onChange(product.codigo, product)
    setShowResults(false)
    if (onProductSelect) {
      onProductSelect(product)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product)}
              className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-zinc-900">{product.codigo}</div>
              <div className="text-sm text-zinc-500 truncate">{product.nome}</div>
              {product.unidade && (
                <div className="text-xs text-zinc-400 mt-1">Unidade: {product.unidade}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-zinc-500 text-center">
            Nenhum produto encontrado para &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
