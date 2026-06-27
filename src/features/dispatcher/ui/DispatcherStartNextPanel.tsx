import { Alert, Button, Card, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'

import { useStartNextRun } from '../hooks/useStartNextRun'
import { boardStatusLabel } from '../model/labels'
import type { BoardFlight } from '../model/types'

type Props = {
  flight: BoardFlight | null
  operationalDate: string
  resolveAirportLabel: (code: string) => string
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) {
      return 'Новый запуск недоступен: предыдущий прогон ещё не завершён.'
    }

    return error.message
  }

  return 'Не удалось начать новый прогон. Повторите попытку.'
}

export function DispatcherStartNextPanel({
  flight,
  operationalDate,
  resolveAirportLabel,
}: Props) {
  const startNext = useStartNextRun()

  if (!flight) {
    return (
      <Card withBorder padding="lg">
        <Text c="dimmed">Выберите завершённый рейс из списка слева</Text>
      </Card>
    )
  }

  const routeCode =
    flight.direction === 'arrival'
      ? flight.originAirportCode
      : flight.destinationAirportCode

  const handleStart = () => {
    startNext.mutate({ flight, operationalDate })
  }

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <div>
          <Title order={4}>{flight.flightNumber}</Title>
          <Text size="sm" c="dimmed">
            {flight.direction === 'arrival' ? 'Прибытие · ' : 'Вылет · '}
            {resolveAirportLabel(routeCode)}
          </Text>
          <Text size="sm" fw={500} mt={4}>
            Текущий статус: {boardStatusLabel(flight.status)}
          </Text>
        </div>

        <Text size="sm" c="dimmed">
          Рейс прошёл свой цикл. «Новый запуск» создаст новый прогон этой карточки
          на тот же день, и она снова станет доступна для начала регистрации или
          прибытия.
        </Text>

        {startNext.isError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            title="Новый прогон не создан"
          >
            {errorMessage(startNext.error)}
          </Alert>
        )}

        {startNext.isSuccess && (
          <Alert
            color="green"
            icon={<IconCircleCheck size={16} />}
            title="Новый прогон создан"
          >
            Карточка снова доступна для запуска объявлений.
          </Alert>
        )}

        <Button
          onClick={handleStart}
          loading={startNext.isPending}
          disabled={startNext.isSuccess}
        >
          Новый запуск
        </Button>
      </Stack>
    </Card>
  )
}
