import { useState } from 'react'

import { Alert, Button, Group, Modal, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'

import { ApiClientError } from '@/shared/api/apiClient'

import { useCreateAirport, useUpdateAirport } from '../hooks/useAirports'
import type { Airport, AirportCreateInput } from '../model/types'

type Props = {
  airport: Airport | null
  onClose: () => void
}

export function AirportForm({ airport, onClose }: Props) {
  const create = useCreateAirport()
  const update = useUpdateAirport()
  const [error, setError] = useState<string | null>(null)
  const mutation = airport ? update : create
  const form = useForm<AirportCreateInput>({
    initialValues: airport
      ? {
          code: airport.code,
          name: airport.name,
          cityName: airport.cityName,
          countryCode: airport.countryCode,
        }
      : { code: '', name: '', cityName: '', countryCode: '' },
    validate: {
      code: (value) =>
        /^[A-Za-z]{3}$/.test(value.trim()) ? null : 'Введите IATA-код из 3 букв',
      name: (value) => (value.trim() ? null : 'Введите название аэропорта'),
      cityName: (value) => (value.trim() ? null : 'Введите название города'),
      countryCode: (value) =>
        /^[A-Za-z]{2}$/.test(value.trim()) ? null : 'Введите код страны из 2 букв',
    },
  })

  async function submit(values: AirportCreateInput) {
    const normalized = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      cityName: values.cityName.trim(),
      countryCode: values.countryCode.trim().toUpperCase(),
    }
    setError(null)

    try {
      if (airport) {
        await update.mutateAsync({
          id: airport.id,
          input: {
            name: normalized.name,
            cityName: normalized.cityName,
            countryCode: normalized.countryCode,
          },
        })
      } else {
        await create.mutateAsync(normalized)
      }
      onClose()
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.violations) {
        form.setErrors(caught.violations)
      }
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? 'Аэропорт с таким кодом уже существует.'
          : caught instanceof Error
            ? caught.message
            : 'Не удалось сохранить аэропорт.',
      )
    }
  }

  return (
    <Modal opened onClose={onClose} title={airport ? 'Редактировать аэропорт' : 'Новый аэропорт'} centered>
      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput label="IATA-код" required disabled={airport !== null} maxLength={3} {...form.getInputProps('code')} />
          <TextInput label="Город" required {...form.getInputProps('cityName')} />
          <TextInput label="Название аэропорта" required {...form.getInputProps('name')} />
          <TextInput label="Код страны" required maxLength={2} {...form.getInputProps('countryCode')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={mutation.isPending}>Отмена</Button>
            <Button type="submit" loading={mutation.isPending}>Сохранить</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

