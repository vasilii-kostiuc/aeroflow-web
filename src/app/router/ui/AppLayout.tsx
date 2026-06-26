import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBroadcast,
  IconBuildingAirport,
  IconPlaneDeparture,
} from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet } from 'react-router'

import { paths } from '@/app/router/paths'
import { CurrentUserMenu } from '@/features/auth/ui/CurrentUserMenu'

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
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap">
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
          <CurrentUserMenu />
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
        <NavLink
          component={RouterNavLink}
          to={paths.airports}
          label="Аэропорты"
          leftSection={<IconBuildingAirport size={18} />}
          onClick={close}
        />
        <NavLink
          component={RouterNavLink}
          to={paths.dispatcher}
          label="Панель диспетчера"
          leftSection={<IconBroadcast size={18} />}
          onClick={close}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
