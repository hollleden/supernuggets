export default function VaultLoading() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-row overflow-hidden animate-pulse"
            style={{ minHeight: '120px' }}
          >
            <div className="shrink-0 bg-muted" style={{ width: '120px' }} />
            <div className="flex-1 flex flex-col p-3 gap-2">
              <div className="h-2.5 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted rounded w-3/5" />
              <div className="h-2 bg-muted rounded w-2/5 mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
