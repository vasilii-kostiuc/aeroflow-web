import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AppRole } from '@/features/auth/model/roles'

import { changeUserRole, createUser, getUsers, setUserPassword, userKeys } from '../api/userApi'

export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: getUsers })
}

function useInvalidateUsers() {
  const client = useQueryClient()

  return () => client.invalidateQueries({ queryKey: userKeys.all })
}

export function useCreateUser() {
  return useMutation({ mutationFn: createUser, onSuccess: useInvalidateUsers() })
}

export function useChangeUserRole() {
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppRole | null }) => changeUserRole(id, role),
    onSuccess: useInvalidateUsers(),
  })
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => setUserPassword(id, password),
  })
}
