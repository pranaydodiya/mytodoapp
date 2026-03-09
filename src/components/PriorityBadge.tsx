'use client'

import { Priority } from '@/types/todo'

interface Props {
  priority: Priority
  className?: string
}

const styles: Record<Priority, string> = {
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  high:   'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
}

export default function PriorityBadge({ priority, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[priority]} ${className}`}
    >
      {priority}
    </span>
  )
}
