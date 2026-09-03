export default function ShopLoading() {
  return (
    <main style={{ paddingTop: '50px', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        {/* Breadcrumb skeleton */}
        <div style={{ height: '14px', width: '180px', background: '#E8E6E0', borderRadius: '2px', marginBottom: '2rem' }} />
        {/* Hero skeleton */}
        <div style={{ height: '60vh', background: '#E8E6E0', marginBottom: '4rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
        {/* Cards skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: '#E8E6E0', height: '300px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  )
}
