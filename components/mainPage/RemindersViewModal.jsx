"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

export function RemindersViewModal({
  visible,
  onClose,
  reminders,
  onCreateNewReminder,
  onEditReminder,
  onDeleteReminder,
  loading
}) {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Servis Hatırlatıcıları</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Planlanan Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Mesaj</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      {format(new Date(reminder.scheduledAt), "dd/MM/yyyy")} {/* Updated date format */}
                    </TableCell>
                    <TableCell>{reminder.status}</TableCell>
                    <TableCell>{reminder.message || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditReminder(reminder)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteReminder(reminder)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button onClick={onCreateNewReminder}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Hatırlatıcı
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}