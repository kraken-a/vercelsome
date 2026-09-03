export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-beige border-t-vert-persan" />
        <p className="text-beige-fonce text-sm font-mono uppercase tracking-wider">
          Chargement...
        </p>
      </div>
    </main>
  )
}
