"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
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
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
}

const STATUS_MAP_TO_API = {
  'SCHEDULED': 'SCHEDULED',
  'SENT': 'SENT',
  'CANCELED': 'CANCELED',
  'FAILED': 'FAILED',
}

const STATUS_MAP_FROM_API = {
  'SCHEDULED': 'SCHEDULED',
  'SENT': 'SENT',
  'CANCELED': 'CANCELED',
  'FAILED': 'FAILED',
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
      status: 'SCHEDULED',
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
        status: 'SCHEDULED',
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
            {selectedReminder ? 'Edit Reminder' : 'New Reminder'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <div className="flex flex-col space-y-2">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      className="rounded-md border w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Selected date: {field.value ? format(field.value, 'dd/MM/yyyy') : 'No date selected'}
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
                  <FormLabel>Time *</FormLabel>
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Message to be sent to the customer"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedReminder ? 'Save Changes' : 'Create Reminder'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}