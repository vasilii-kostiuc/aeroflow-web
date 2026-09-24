import { Button, Paper, Stack } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

import { paths } from '@/app/router/paths'
import { useCreateFlightDefinition } from '@/features/flight-definitions/hooks/useFlightDefinitions'
import type { FlightDefinitionInput } from '@/features/flight-definitions/model/types'
import { FlightDefinitionDetailsForm } from '@/features/flight-definitions/ui/FlightDefinitionDetailsForm'
import { PageHeader } from '@/shared/ui/PageHeader'

export function FlightDefinitionCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateFlightDefinition()

  async function createFlightDefinition(input: FlightDefinitionInput) {
    const created = await createMutation.mutateAsync(input)
    notifications.show({
      color: 'success',
      message: `Карточка ${created.flightNumber} создана`,
    })
    navigate(paths.flightDefinitionDetailsPath(created.id))
  }

  return (
    <Stack gap="lg">
      <PageHeader
        title="Новая карточка рейса"
        description="Номер, направление и маршрут. Объявления настраиваются после создания."
        actions={
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate(paths.flightDefinitions)}
          >
            К списку
          </Button>
        }
      />

      <Paper withBorder p="lg">
        <FlightDefinitionDetailsForm
          submitLabel="Создать"
          submitting={createMutation.isPending}
          onCancel={() => navigate(paths.flightDefinitions)}
          onSubmit={createFlightDefinition}
        />
      </Paper>
    </Stack>
  )
}
