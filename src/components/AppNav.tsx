import Link from 'next/link'

const link =
  'text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm"
        aria-label="Main"
      >
        <Link href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tasks
        </Link>
        <Link href="/about" className={link}>
          About
        </Link>
        <Link href="/help" className={link}>
          Help
        </Link>
      </nav>
    </header>
  )
}
