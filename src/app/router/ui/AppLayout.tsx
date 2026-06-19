import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlaneDeparture } from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet } from 'react-router'

import { paths } from '@/app/router/paths'

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      <AppShell.Header px="lg">
        <Group h="100%">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Открыть навигацию"
          />
          <div>
            <Title order={3}>AeroFlow</Title>
            <Text size="xs" c="dimmed">
              Airport announcements
            </Text>
          </div>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={RouterNavLink}
          to={paths.flightDefinitions}
          label="Карточки рейсов"
          leftSection={<IconPlaneDeparture size={18} />}
          onClick={close}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
