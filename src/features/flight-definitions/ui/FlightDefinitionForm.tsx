import { useState } from 'react'

import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'

import { ApiClientError } from '@/shared/api/apiClient'
import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'

import {
  useCreateFlightDefinition,
  useUpdateFlightDefinition,
} from '../hooks/useFlightDefinitions'
import type {
  FlightDefinition,
  FlightDefinitionInput,
} from '../model/types'
import {
  normalizeFlightDefinitionInput,
  validateFlightDefinitionInput,
} from '../model/validation'

type Props = {
  opened: boolean
  flightDefinition: FlightDefinition | null
  onClose: () => void
}

const emptyValues: FlightDefinitionInput = {
  flightNumber: '',
  direction: 'departure',
  originAirportCode: '',
  destinationAirportCode: '',
}

export function FlightDefinitionForm({
  opened,
  flightDefinition,
  onClose,
}: Props) {
  const createMutation = useCreateFlightDefinition()
  const updateMutation = useUpdateFlightDefinition()
  const airports = useAirports({ page: 1, limit: 100 })
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<FlightDefinitionInput>({
    initialValues: flightDefinition
      ? {
          flightNumber: flightDefinition.flightNumber,
          direction: flightDefinition.direction,
          originAirportCode: flightDefinition.originAirportCode,
          destinationAirportCode: flightDefinition.destinationAirportCode,
        }
      : emptyValues,
    validate: validateFlightDefinitionInput,
  })
  const mutation = flightDefinition ? updateMutation : createMutation
  const airportOptions = (airports.data?.items ?? [])
    .filter(
      (airport) =>
        airport.active ||
        airport.code === flightDefinition?.originAirportCode ||
        airport.code === flightDefinition?.destinationAirportCode,
    )
    .map((airport) => ({
      value: airport.code,
      label: formatAirportLabel(airport),
    }))

  async function handleSubmit(values: FlightDefinitionInput) {
    setFormError(null)
    form.clearErrors()
    const input = normalizeFlightDefinitionInput(values)

    try {
      if (flightDefinition) {
        await updateMutation.mutateAsync({ id: flightDefinition.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      onClose()
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.violations) {
          form.setErrors(error.violations)
        }

        if (error.status === 409) {
          setFormError('Такая карточка рейса уже существует.')
        } else if (error.status === 404) {
          setFormError('Карточка больше не существует. Обновите список.')
        } else if (!error.violations) {
          setFormError(error.message)
        }
      } else {
        setFormError('Не удалось сохранить карточку рейса.')
      }
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={flightDefinition ? 'Редактировать карточку' : 'Новая карточка рейса'}
      centered
      closeOnClickOutside={!mutation.isPending}
      closeOnEscape={!mutation.isPending}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {formError && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {formError}
            </Alert>
          )}

          <TextInput
            label="Номер рейса"
            placeholder="5F123"
            maxLength={7}
            required
            {...form.getInputProps('flightNumber')}
          />

          <Select
            label="Направление"
            data={[
              { value: 'departure', label: 'Вылет' },
              { value: 'arrival', label: 'Прибытие' },
            ]}
            allowDeselect={false}
            required
            {...form.getInputProps('direction')}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Аэропорт отправления"
              placeholder="Выберите аэропорт"
              searchable
              data={airportOptions}
              required
              {...form.getInputProps('originAirportCode')}
            />
            <Select
              label="Аэропорт назначения"
              placeholder="Выберите аэропорт"
              searchable
              data={airportOptions}
              required
              {...form.getInputProps('destinationAirportCode')}
            />
          </SimpleGrid>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {flightDefinition ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
