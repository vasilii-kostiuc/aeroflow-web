import type { ReactNode } from 'react'

import { AppShell, Burger, Group, NavLink, Stack, Text, ThemeIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconBroadcast,
  IconBuildingAirport,
  IconMusic,
  IconPlaneDeparture,
  IconSpeakerphone,
} from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet } from 'react-router'

import { paths } from '@/app/router/paths'
import { CurrentUserMenu } from '@/features/auth/ui/CurrentUserMenu'

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" mb={4}>
        {label}
      </Text>
      {children}
    </div>
  )
}

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()

  const link = (to: string, label: string, icon: ReactNode) => (
    <NavLink component={RouterNavLink} to={to} label={label} leftSection={icon} onClick={close} />
  )

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      <AppShell.Header px="lg">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Открыть навигацию"
            />
            <ThemeIcon size={30} radius="md" variant="filled" aria-hidden>
              <IconBroadcast size={18} />
            </ThemeIcon>
            <Text fw={700} size="lg">
              AeroFlow
            </Text>
          </Group>
          <CurrentUserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="lg">
          <NavSection label="Работа">
            {link(paths.dispatcher, 'Панель диспетчера', <IconBroadcast size={18} />)}
          </NavSection>
          <NavSection label="Справочники">
            {link(paths.flightDefinitions, 'Карточки рейсов', <IconPlaneDeparture size={18} />)}
            {link(paths.airports, 'Аэропорты', <IconBuildingAirport size={18} />)}
            {link(
              paths.supplementaryTemplates,
              'Дополнительные объявления',
              <IconSpeakerphone size={18} />,
            )}
            {link(
              paths.emergencyTemplates,
              'Экстренные объявления',
              <IconAlertTriangle size={18} />,
            )}
            {link(paths.audioAssets, 'Аудиобиблиотека', <IconMusic size={18} />)}
          </NavSection>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
