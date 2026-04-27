export default function RootLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center p-6"
      role="status"
      aria-label="Loading"
    >
      <div className="h-6 w-6 animate-pulse rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
    </div>
  )
}
