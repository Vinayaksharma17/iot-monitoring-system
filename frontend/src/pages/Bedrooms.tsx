import { useState } from 'react'
import { Bed, Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useBedrooms,
  useCreateBedroom,
  useUpdateBedroom,
  useDeleteBedroom,
} from '@/hooks/useBedrooms'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import type { Bedroom } from '@/types'

const bedroomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description too long'),
})

type BedroomFormData = z.infer<typeof bedroomSchema>

export function Bedrooms() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBedroom, setEditingBedroom] = useState<Bedroom | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: bedrooms, isLoading } = useBedrooms()
  const createMutation = useCreateBedroom()
  const updateMutation = useUpdateBedroom()
  const deleteMutation = useDeleteBedroom()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BedroomFormData>({
    resolver: zodResolver(bedroomSchema),
  })

  const openCreateModal = () => {
    setEditingBedroom(null)
    reset({ name: '', description: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (bedroom: Bedroom) => {
    setEditingBedroom(bedroom)
    reset({ name: bedroom.name, description: bedroom.description })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBedroom(null)
    reset()
  }

  const onSubmit = async (data: BedroomFormData) => {
    try {
      if (editingBedroom) {
        await updateMutation.mutateAsync({
          id: editingBedroom.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      closeModal()
    } catch (error) {
      console.error('Failed to save bedroom:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bedroom?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete bedroom:', error)
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bed className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No bedrooms
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new bedroom
          </p>
          <div className="mt-6">
            <Button onClick={openCreateModal}>
              <Plus className="h-5 w-5 mr-2" />
              Add Bedroom
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bedrooms.map((bedroom) => (
            <div
              key={bedroom.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Bed className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {bedroom.name}
                    </h3>
                    <p className="text-sm text-gray-500">{bedroom.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">ID: {bedroom.id}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(bedroom)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bedroom.id)}
                    disabled={deletingId === bedroom.id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === bedroom.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBedroom ? 'Edit Bedroom' : 'Add Bedroom'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Master Bedroom"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., First Floor, North Wing"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBedroom ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
