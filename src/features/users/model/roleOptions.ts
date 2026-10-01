import { roleLabels } from '@/features/auth/model/roles'

/** Select value for «Без доступа» (the API's `role: null`). */
export const NO_ROLE = 'none'

export const roleOptions = [
  { value: 'dispatcher', label: roleLabels.dispatcher },
  { value: 'admin', label: roleLabels.admin },
  { value: NO_ROLE, label: 'Без доступа' },
]
