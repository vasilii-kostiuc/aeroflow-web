import { Badge, Button, Group, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { useAuthStore } from '@/features/auth/model/authStore'
import { roleLabels, userRole } from '@/features/auth/model/roles'

export function CurrentUserMenu() {
  const user = useAuthStore((state) => state.session?.user)
  const logoutMutation = useLogout()
  const role = userRole(user)

  if (!user) {
    return null
  }

  return (
    <Group gap="sm" wrap="nowrap">
      <Text size="sm" c="dimmed" visibleFrom="sm">
        {user.email}
      </Text>
      <Badge variant="light" color="gray" visibleFrom="sm">
        {role ? roleLabels[role] : 'Без роли'}
      </Badge>
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconLogout size={18} />}
        loading={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate()}
      >
        Выйти
      </Button>
    </Group>
  )
}
