import { Button, Group, Stack, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'

import { useLogout } from '@/features/auth/hooks/useLogout'
import { useAuthStore } from '@/features/auth/model/authStore'

export function CurrentUserMenu() {
  const user = useAuthStore((state) => state.session?.user)
  const logoutMutation = useLogout()

  if (!user) {
    return null
  }

  return (
    <Group gap="sm" wrap="nowrap">
      <Stack gap={0} align="flex-end" visibleFrom="sm">
        <Text size="sm" fw={600}>
          {user.email}
        </Text>
        <Text size="xs" c="dimmed">
          Авторизован
        </Text>
      </Stack>
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
