'use client'

import { Category } from '@/types/todo'

interface Props {
  category: Category
  className?: string
}

export default function CategoryTag({ category, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: category.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-white/70"
        aria-hidden="true"
      />
      {category.name}
    </span>
  )
}
