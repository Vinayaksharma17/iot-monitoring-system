import { memo, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  GRAFANA_DASHBOARDS,
  type GrafanaDashboardKey,
} from '@/utils/grafana'

type GrafanaDashboardModalProps = {
  dashboardKey: GrafanaDashboardKey
  onClose: () => void
}

const TITLES: Record<GrafanaDashboardKey, string> = {
  allBedrooms: 'All Bedrooms - Real-Time Overview',
  singleBedroom: 'Single Bedroom Dashboard',
}

export const GrafanaDashboardModal = memo(function GrafanaDashboardModal({
  dashboardKey,
  onClose,
}: GrafanaDashboardModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={TITLES[dashboardKey]}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center">
        <div className="relative bg-white w-screen h-screen flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <h3 className="text-xl font-semibold text-gray-900">
              {TITLES[dashboardKey]}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dashboard"
              className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <iframe
              src={GRAFANA_DASHBOARDS[dashboardKey]}
              className="w-full h-full border-0"
              title={TITLES[dashboardKey]}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  )
})
