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
  import { Edit, Trash2, CalendarCheck2 } from "lucide-react"
  
  export function ServicesViewModal({
    visible,
    onClose,
    services,
    loadingOnModal,
    selectedCustomer,
    onEditService,
    onDeleteService,
    onViewReminders,
  }) {
    return (
      <Dialog open={visible} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Services for {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>{service.paymentType}</TableCell>
                  <TableCell>{service.periodPrice} {service.currency}</TableCell>
                  <TableCell>{service.startingDate.toString().split('T')[0]}</TableCell>
                  <TableCell>{service.endingDate.toString().split('T')[0]}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteService(service)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewReminders(service)}
                    >
                      <CalendarCheck2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    )
  }