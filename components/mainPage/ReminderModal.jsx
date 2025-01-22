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

const ReminderStatus = {
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
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
      // Handle both string and Date formats
      const scheduledDate = typeof selectedReminder.scheduledAt === 'string'
        ? parseISO(selectedReminder.scheduledAt)
        : new Date(selectedReminder.scheduledAt)

      reset({
        scheduledAt: format(scheduledDate, "yyyy-MM-dd'T'HH:mm"),
        status: selectedReminder.status,
        message: selectedReminder.message,
      })
    } else {
      reset({
        scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"), // Default to current datetime
        status: 'SCHEDULED',
        message: '',
      })
    }
  }, [selectedReminder, reset])

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      // Convert local datetime to ISO string
      scheduledAt: new Date(data.scheduledAt).toISOString(),
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">Scheduled At *</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register('scheduledAt', { required: true })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(val) => setValue('status', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              {...register('message')}
              placeholder="Optional message"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedReminder ? 'Save Changes' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}