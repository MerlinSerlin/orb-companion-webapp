import { useMutation } from '@tanstack/react-query'
import { createCustomer } from '@/app/actions'

// Hook to create a customer
export function useCreateCustomer() {
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      const result = await createCustomer(name, email)
      if (!result.success) throw new Error(result.error)
      return result.customerId
    },
  })
} 