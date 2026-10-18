import { memo } from 'react'
import { Bed, Edit2, Trash2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Bedroom } from '@/types'

type BedroomCardProps = {
  bedroom: Bedroom
  isDeleting: boolean
  onEdit: (bedroom: Bedroom) => void
  onDelete: (id: number) => void
}

export const BedroomCard = memo(function BedroomCard({
  bedroom,
  isDeleting,
  onEdit,
  onDelete,
}: BedroomCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Bed className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {bedroom.name}
            </h3>
            {bedroom.description && (
              <p className="text-sm text-gray-500">{bedroom.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500">ID: {bedroom.id}</span>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => onEdit(bedroom)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(bedroom.id)}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
})
