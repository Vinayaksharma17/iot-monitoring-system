import { useState } from 'react'
import { Bed, Plus } from 'lucide-react'
import {
  useBedrooms,
  useDeleteBedroom,
} from '@/hooks/useBedrooms'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { BedroomCard } from '@/components/bedrooms/BedroomCard'
import { BedroomFormModal } from '@/components/bedrooms/BedroomFormModal'
import type { Bedroom } from '@/types'

export function Bedrooms() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBedroom, setEditingBedroom] = useState<Bedroom | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const {
    data: bedrooms,
    isLoading,
    isError,
    error,
    refetch,
  } = useBedrooms()
  const deleteMutation = useDeleteBedroom()

  const openCreateModal = () => {
    setEditingBedroom(null)
    setIsModalOpen(true)
  }

  const openEditModal = (bedroom: Bedroom) => {
    setEditingBedroom(bedroom)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBedroom(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bedroom?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (deleteError) {
      console.error('Failed to delete bedroom:', deleteError)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load bedrooms"
        message={error?.message}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bedrooms</h1>
          <p className="mt-2 text-gray-600">Manage bedroom descriptions</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-5 w-5 mr-2" />
          Add Bedroom
        </Button>
      </div>

      {/* Bedrooms Grid */}
      {!bedrooms || bedrooms.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No bedrooms"
          description="Get started by creating a new bedroom"
          action={
            <Button onClick={openCreateModal}>
              <Plus className="h-5 w-5 mr-2" />
              Add Bedroom
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bedrooms.map((bedroom) => (
            <BedroomCard
              key={bedroom.id}
              bedroom={bedroom}
              isDeleting={deletingId === bedroom.id}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <BedroomFormModal
        isOpen={isModalOpen}
        editingBedroom={editingBedroom}
        onClose={closeModal}
      />
    </div>
  )
}
