import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

export function FlightDefinitionsPage() {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1}>Карточки рейсов</Title>
          <Text c="dimmed" mt={4}>
            Каталог FlightDefinition для ручной работы диспетчера.
          </Text>
        </div>

        <Button leftSection={<IconPlus size={18} />} disabled>
          Добавить карточку
        </Button>
      </Group>

      <Paper withBorder radius="lg" p="xl">
        <Text fw={600}>Feature ещё не подключена</Text>
        <Text c="dimmed" size="sm" mt={4}>
          Здесь появятся фильтры, пагинация и управление карточками рейсов через
          API aeroflow-core.
        </Text>
      </Paper>
    </Stack>
  )
}
