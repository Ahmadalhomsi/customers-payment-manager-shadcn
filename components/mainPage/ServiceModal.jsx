import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { useEffect, useState } from "react"

const paymentTypes = [
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Yearly', label: 'Yearly' },
];

const currencies = [
    { value: 'TL', label: '₺' },
    { value: 'USD', label: '$' },
    { value: 'EUR', label: '€' },
];

export function ServiceModal({ visible, onClose, onSubmit, selectedCustomer, selectedService }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        paymentType: 'Monthly',
        periodPrice: 0,
        currency: 'TL',
        startingDate: '',
        endingDate: ''
    });

    useEffect(() => {
        if (selectedService) {
            setFormData({
                name: selectedService.name,
                description: selectedService.description,
                paymentType: selectedService.paymentType,
                periodPrice: selectedService.periodPrice,
                currency: selectedService.currency,
                startingDate: selectedService.startingDate,
                endingDate: selectedService.endingDate
            });
        } else {
            setFormData({
                name: '',
                description: '',
                paymentType: 'Monthly',
                periodPrice: 0,
                currency: 'TL',
                startingDate: '',
                endingDate: ''
            });
        }
    }, [selectedService]);

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {selectedService ? 'Edit' : 'Add'} Service for {selectedCustomer?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Service Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Payment Type</Label>
                        <Select
                            value={formData.paymentType}
                            onValueChange={(value) => handleChange('paymentType', value)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Price</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input
                                type="number"
                                value={formData.periodPrice.toString()}
                                onChange={(e) => handleChange('periodPrice', parseFloat(e.target.value))}
                            />
                            <Select
                                value={formData.currency}
                                onValueChange={(value) => handleChange('currency', value)}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.value} value={currency.value}>
                                            {currency.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Dates</Label>
                        <div className="col-span-3 flex gap-2">
                            <div className="flex flex-col gap-1">
                                <Label>Start Date</Label>
                                <Calendar
                                    mode="single"
                                    selected={formData.startingDate}
                                    onSelect={(date) => handleChange('startingDate', date)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label>End Date</Label>
                                <Calendar
                                    mode="single"
                                    selected={formData.endingDate}
                                    onSelect={(date) => handleChange('endingDate', date)}
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" onClick={handleSubmit}>
                        Submit
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}