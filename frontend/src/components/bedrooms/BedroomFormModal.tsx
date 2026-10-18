import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bedroomSchema, type BedroomFormData } from '@/validation/schemas'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { useCreateBedroom, useUpdateBedroom } from '@/hooks/useBedrooms'
import type { Bedroom } from '@/types'

type BedroomFormModalProps = {
  isOpen: boolean
  editingBedroom: Bedroom | null
  onClose: () => void
}

const permissionHint = (message: string) =>
  `${message}. Please login as admin or contact an admin.`

export function BedroomFormModal({
  isOpen,
  editingBedroom,
  onClose,
}: BedroomFormModalProps) {
  const createMutation = useCreateBedroom()
  const updateMutation = useUpdateBedroom()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BedroomFormData>({
    resolver: zodResolver(bedroomSchema),
    values: {
      name: editingBedroom?.name ?? '',
      description: editingBedroom?.description ?? '',
    },
  })

  const handleClose = () => {
    clearErrors()
    reset()
    onClose()
  }

  const onSubmit = async (data: BedroomFormData) => {
    try {
      if (editingBedroom) {
        await updateMutation.mutateAsync({ id: editingBedroom.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save bedroom'
      setError('root', {
        type: 'server',
        message: permissionHint(message),
      })
    }
  }

  const mutationError = createMutation.error ?? updateMutation.error

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingBedroom ? 'Edit Bedroom' : 'Add Bedroom'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="bedroom-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="bedroom-name"
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
            htmlFor="bedroom-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <input
            id="bedroom-description"
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

        {(errors.root || mutationError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {errors.root?.message ||
              (mutationError instanceof Error
                ? permissionHint(mutationError.message)
                : 'Action not permitted. Please login as admin or contact an admin.')}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
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
  )
}
