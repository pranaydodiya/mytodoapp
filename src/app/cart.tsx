'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCartItems, removeFromCart, getTotalProtein, type CartItem } from '@/lib/cartUtils'

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [totalProtein, setTotalProtein] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateCart = () => {
      const items = getCartItems()
      setCartItems(items)
      setTotalProtein(getTotalProtein())
    }

    updateCart()

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCart)

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      window.removeEventListener('cartUpdated', updateCart)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleRemove = (itemId: string) => {
    removeFromCart(itemId)
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Cart</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 font-medium">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add products to see them here</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {item.image && (
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/category/${item.categorySlug}/${item.foodSlug}`}
                    onClick={onClose}
                    className="block"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-[#9fcc2e] transition-colors">
                      {item.name}
                    </h4>
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-600">Protein: {item.protein}</span>
                    {item.calories && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">{item.calories} kcal</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Remove from cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Total Protein */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-[#9fcc2e]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Total Protein:</span>
            <span className="text-lg font-bold text-[#9fcc2e]">{totalProtein}g</span>
          </div>
          <div className="text-xs text-gray-500 text-center mb-3">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            className="block w-full bg-[#9fcc2e] hover:bg-[#8bb825] text-white font-bold py-2.5 px-4 rounded-lg text-center transition-all duration-300 transform hover:scale-[1.02] shadow-md"
          >
            View Full Cart
          </Link>
        </div>
      )}
    </div>
  )
}

