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
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"

const ReminderStatus = {
  SCHEDULED: 'PLANLANMIŞ',
  SENT: 'GÖNDERİLDİ',
  CANCELED: 'İPTAL EDİLDİ',
  FAILED: 'BAŞARISIZ',
}

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
  const form = useForm({
    defaultValues: {
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      status: 'PLANLANMIŞ',
      message: '',
    }
  })

  useEffect(() => {
    if (selectedReminder) {
      const scheduledDate = typeof selectedReminder.scheduledAt === 'string'
        ? parseISO(selectedReminder.scheduledAt)
        : new Date(selectedReminder.scheduledAt)

      form.reset({
        date: scheduledDate,
        time: format(scheduledDate, 'HH:mm'),
        status: STATUS_MAP_FROM_API[selectedReminder.status],
        message: selectedReminder.message,
      })
    } else {
      const now = new Date()
      form.reset({
        date: now,
        time: format(now, 'HH:mm'),
        status: 'PLANLANMIŞ',
        message: '',
      })
    }
  }, [selectedReminder, form])

  const handleFormSubmit = (data) => {
    const dateStr = format(data.date, 'yyyy-MM-dd')
    const dateTime = new Date(`${dateStr}T${data.time}`)
    onSubmit({
      ...data,
      scheduledAt: dateTime.toISOString(),
      status: STATUS_MAP_TO_API[data.status],
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tarih *</FormLabel>
                  <div className="flex flex-col space-y-2">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={tr}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      className="rounded-md border w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Seçilen tarih: {field.value ? format(field.value, 'dd/MM/yyyy') : 'Tarih seçilmedi'}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saat *</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="w-[120px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ReminderStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesaj</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Müşteriye gönderilecek mesaj"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">
                {selectedReminder ? 'Değişiklikleri Kaydet' : 'Hatırlatıcı Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}