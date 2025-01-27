"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const ReminderStatus = {
  SCHEDULED: 'PLANLANMIŞ',
  SENT: 'GÖNDERİLDİ',
  CANCELED: 'İPTAL EDİLDİ',
  FAILED: 'BAŞARISIZ',
}

// Status mapping for API communication
const STATUS_MAP_TO_API = {
  'PLANLANMIŞ': 'SCHEDULED',
  'GÖNDERİLDİ': 'SENT',
  'İPTAL EDİLDİ': 'CANCELED',
  'BAŞARISIZ': 'FAILED',
}

const STATUS_MAP_FROM_API = {
  'SCHEDULED': 'PLANLANMIŞ',
  'SENT': 'GÖNDERİLDİ',
  'CANCELED': 'İPTAL EDİLDİ',
  'FAILED': 'BAŞARISIZ',
}

export function ReminderModal({
  visible,
  onClose,
  onSubmit,
  selectedReminder,
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm()

  useEffect(() => {
    if (selectedReminder) {
      const scheduledDate = typeof selectedReminder.scheduledAt === 'string'
        ? parseISO(selectedReminder.scheduledAt)
        : new Date(selectedReminder.scheduledAt)

      reset({
        scheduledAt: format(scheduledDate, "yyyy-MM-dd'T'HH:mm"),
        status: STATUS_MAP_FROM_API[selectedReminder.status],
        message: selectedReminder.message,
      })
    } else {
      reset({
        scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: 'PLANLANMIŞ',
        message: '',
      })
    }
  }, [selectedReminder, reset])

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
      status: STATUS_MAP_TO_API[data.status], // Convert Turkish status back to API status
    })
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedReminder ? 'Hatırlatıcı Düzenle' : 'Yeni Hatırlatıcı'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">Planlanma Zamanı *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register('scheduledAt', { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="status">Durum</Label>
            <Select
              value={watch('status')}
              onValueChange={(val) => setValue('status', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ReminderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Mesaj</Label>
            <Input
              id="message"
              {...register('message')}
              placeholder="Müşteriye gönderilecek mesaj"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">
              {selectedReminder ? 'Değişiklikleri Kaydet' : 'Hatırlatıcı Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}