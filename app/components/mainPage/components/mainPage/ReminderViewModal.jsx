import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Button } from "@/components/ui/button"
  import { Plus, Edit, Trash2 } from "lucide-react"
  
  export function ReminderViewModal({
    visible,
    onClose,
    reminders,
    onCreateNewReminder,
    onEditReminder,
    onDeleteReminder,
    loading,
  }) {
    return (
      <Dialog open={visible} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Service Reminders</DialogTitle>
          </DialogHeader>
  
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell>
                    {new Date(reminder.scheduledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{reminder.status}</TableCell>
                  <TableCell>{reminder.message}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditReminder(reminder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteReminder(reminder)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
  
          <div className="flex justify-end">
            <Button onClick={onCreateNewReminder}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }