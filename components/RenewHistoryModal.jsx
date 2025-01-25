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
import { Trash2 } from "lucide-react";
import { BeatLoader } from "react-spinners";


export function RenewHistoryModal({
  visible,
  onClose,
  renewHistory,
  loadingOnModal,
  selectedService,
  onDeleteRenewal,
}) {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Renew History for {selectedService?.name}
          </DialogTitle>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Renewal ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Previous End</TableHead>
              <TableHead>New End</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingOnModal ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <BeatLoader color="#f26000" />
                  </div>
                </TableCell>
              </TableRow>
            ) : renewHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No renewal history found.
                </TableCell>
              </TableRow>
            ) : (
              renewHistory.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="font-medium">{renewal.id}</TableCell>
                  <TableCell>{renewal.name}</TableCell>
                  <TableCell>{renewal.type}</TableCell>
                  <TableCell>
                    {new Date(renewal.previousEndDate).toISOString().split('T')[0]}
                  </TableCell>
                  <TableCell>
                    {new Date(renewal.newEndDate).toISOString().split('T')[0]}
                  </TableCell>
                  <TableCell>
                    {new Date(renewal.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRenewal(renewal)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
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