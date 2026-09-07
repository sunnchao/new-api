/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

import type { ImageSpecPriceRow } from './image-spec-price'
import { numericDraftRegex } from './model-pricing-core'

type ImageSpecPriceEditorProps = {
  rows: ImageSpecPriceRow[]
  error?: string
  onChange: (rows: ImageSpecPriceRow[]) => void
}

export function ImageSpecPriceEditor(props: ImageSpecPriceEditorProps) {
  const { t } = useTranslation()

  const updateRow = (
    index: number,
    field: 'key' | 'price',
    value: string
  ) => {
    props.onChange(
      props.rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    )
  }

  return (
    <FieldGroup className='gap-3'>
      <Field>
        <FieldLabel>{t('Image spec prices')}</FieldLabel>
        <FieldDescription>
          {t(
            'Overlay on the fallback price. Lookup order is resolution/quality, then resolution, then quality.'
          )}
        </FieldDescription>
      </Field>

      {props.rows.map((row, index) => (
        <div
          key={row.id}
          className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end'
        >
          <Field>
            <FieldLabel>{t('Spec key')}</FieldLabel>
            <Input
              value={row.key}
              placeholder='2k/medium'
              aria-label={`${t('Spec key')} ${index + 1}`}
              onChange={(event) => updateRow(index, 'key', event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>{t('Fixed price')}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
                inputMode='decimal'
                placeholder='0.07'
                value={row.price}
                aria-label={`${t('Image spec prices')} ${index + 1}`}
                onChange={(event) => {
                  const value = event.target.value
                  if (numericDraftRegex.test(value)) {
                    updateRow(index, 'price', value)
                  }
                }}
              />
              <InputGroupAddon align='inline-end'>
                {t('per image')}
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='shrink-0'
            aria-label={t('Delete')}
            onClick={() =>
              props.onChange(props.rows.filter((item) => item.id !== row.id))
            }
          >
            <Trash2 className='text-destructive h-4 w-4' />
          </Button>
        </div>
      ))}

      {props.error ? (
        <p className='text-destructive text-sm'>{props.error}</p>
      ) : null}

      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-fit'
        onClick={() => {
          const nextId =
            props.rows.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
          props.onChange([...props.rows, { id: nextId, key: '', price: '' }])
        }}
      >
        <Plus data-icon='inline-start' />
        {t('Add spec')}
      </Button>
    </FieldGroup>
  )
}
