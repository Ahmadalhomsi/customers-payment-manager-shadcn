import React from 'react';
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

const paymentTypeColors = {
    '1month': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    '6months': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    '1year': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    '2years': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    '3years': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
};

const paymentTypeLabels = {
    '1month': '1 Ay',
    '6months': '6 Ay',
    '1year': '1 Yıl',
    '2years': '2 Yıl',
    '3years': '3 Yıl',
    'custom': 'Özel'
};

export function RenewHistoryModal({
    visible,
    onClose,
    renewHistory,
    loadingOnModal,
    selectedService,
    onDeleteRenewal,
}) {
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const renderTypeLabel = (type) => {
        return (
            <span
                className={`px-2 py-1 rounded-md text-xs font-medium ${paymentTypeColors[type]}`}
            >
                {paymentTypeLabels[type]}
            </span>
        );
    };

    const renderTableContent = () => {
        if (loadingOnModal) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center">
                            <BeatLoader color="#f26000" />
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        if (renewHistory.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">
                        Yenileme geçmişi bulunamadı.
                    </TableCell>
                </TableRow>
            );
        }

        return renewHistory.map((renewal) => (
            <TableRow key={renewal.id}>
                <TableCell className="font-medium">{renewal.id}</TableCell>
                <TableCell>{renewal.name}</TableCell>
                <TableCell>{renderTypeLabel(renewal.type)}</TableCell>
                <TableCell>{formatDate(renewal.previousEndDate)}</TableCell>
                <TableCell>{formatDate(renewal.newEndDate)}</TableCell>
                <TableCell>{formatDate(renewal.createdAt)}</TableCell>
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
        ));
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {selectedService?.name} için Yenileme Geçmişi
                    </DialogTitle>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Yenileme ID</TableHead>
                            <TableHead>İsim</TableHead>
                            <TableHead>Tür</TableHead>
                            <TableHead>Önceki Bitiş</TableHead>
                            <TableHead>Yeni Bitiş</TableHead>
                            <TableHead>Oluşturulma Tarihi</TableHead>
                            <TableHead>İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableContent()}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}