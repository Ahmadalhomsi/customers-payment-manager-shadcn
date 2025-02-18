import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CalendarCheck2, Plus } from "lucide-react";
import { BeatLoader } from 'react-spinners';

const PAYMENT_TYPES = [
  { value: "1month", label: "1 Month" }, 
  { value: "6months", label: "6 Months" },
  { value: "1year", label: "1 Year" },
  { value: "2years", label: "2 Years" },
  { value: "3years", label: "3 Years" },
  { value: "custom", label: "Custom" },
];

export function ServicesViewModal({
  visible,
  onClose,
  services,
  loadingOnModal,
  selectedCustomer,
  onEditService,
  onDeleteService,
  onViewReminders,
  onAddService,
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPaymentTypeLabel = (value) => {
    const paymentType = PAYMENT_TYPES.find(type => type.value === value);
    return paymentType ? paymentType.label : value;
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Services for {selectedCustomer?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            onClick={() => onAddService(selectedCustomer)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID/Token</TableHead>
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
            {loadingOnModal ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <BeatLoader color="#f26000" />
                  </div>
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.id}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>{getPaymentTypeLabel(service.paymentType)}</TableCell>
                  <TableCell>
                    {service.periodPrice} {service.currency}
                  </TableCell>
                  <TableCell>
                    {formatDate(service.startingDate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(service.endingDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditService(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteService(service)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewReminders(service)}
                      >
                        <CalendarCheck2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}