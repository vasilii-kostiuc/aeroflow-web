import { useState } from 'react'

import {
  Alert,
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm, type UseFormReturnType } from '@mantine/form'
import { IconAlertCircle } from '@tabler/icons-react'

import { useAirports } from '@/features/airports/hooks/useAirports'
import { formatAirportLabel } from '@/features/airports/model/formatAirportLabel'
import { ApiClientError } from '@/shared/api/apiClient'

import type { FlightDefinition, FlightDefinitionInput } from '../model/types'
import {
  normalizeFlightDefinitionInput,
  validateFlightDefinitionInput,
} from '../model/validation'

type Props = {
  flightDefinition?: FlightDefinition | null
  submitLabel: string
  submitting: boolean
  onCancel: () => void
  onSubmit: (input: FlightDefinitionInput) => Promise<void>
}

const emptyValues: FlightDefinitionInput = {
  flightNumber: '',
  direction: 'departure',
  originAirportCode: '',
  destinationAirportCode: '',
}

export function FlightDefinitionDetailsForm({
  flightDefinition,
  submitLabel,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
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

    try {
      await onSubmit(normalizeFlightDefinitionInput(values))
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
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <FlightDefinitionFields
        form={form}
        formError={formError}
        airportOptions={airportOptions}
        mutationPending={submitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
      />
    </form>
  )
}

type FormShape = UseFormReturnType<
  FlightDefinitionInput,
  FlightDefinitionInput,
  typeof validateFlightDefinitionInput
>

function FlightDefinitionFields({
  form,
  formError,
  airportOptions,
  mutationPending,
  submitLabel,
  onCancel,
}: {
  form: FormShape
  formError: string | null
  airportOptions: Array<{ value: string; label: string }>
  mutationPending: boolean
  submitLabel: string
  onCancel: () => void
}) {
  return (
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
        <Button variant="default" onClick={onCancel} disabled={mutationPending}>
          Назад к списку
        </Button>
        <Button type="submit" loading={mutationPending}>
          {submitLabel}
        </Button>
      </Group>
    </Stack>
  )
}
