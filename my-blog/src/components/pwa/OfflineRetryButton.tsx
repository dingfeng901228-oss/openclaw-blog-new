'use client'

export default function OfflineRetryButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') window.location.reload()
      }}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: '#ffffff',
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}