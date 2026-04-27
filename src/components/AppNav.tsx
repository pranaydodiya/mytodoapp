'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const inactive =
  'text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
const active =
  'font-semibold text-zinc-900 dark:text-zinc-50'

function linkClassName(href: string, pathname: string | null): string {
  if (href === '/') {
    return pathname === '/' ? active : inactive
  }
  return pathname === href ? active : inactive
}

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm"
        aria-label="Main"
      >
        <Link
          href="/"
          className={
            pathname === '/'
              ? active + ' tracking-tight'
              : `${inactive} font-medium tracking-tight`
          }
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          Tasks
        </Link>
        <Link
          href="/about"
          className={linkClassName('/about', pathname)}
          aria-current={pathname === '/about' ? 'page' : undefined}
        >
          About
        </Link>
        <Link
          href="/help"
          className={linkClassName('/help', pathname)}
          aria-current={pathname === '/help' ? 'page' : undefined}
        >
          Help
        </Link>
        <Link
          href="/settings"
          className={linkClassName('/settings', pathname)}
          aria-current={pathname === '/settings' ? 'page' : undefined}
        >
          Settings
        </Link>
      </nav>
    </header>
  )
}
