import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { BeatLoader } from "react-spinners";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';

const PAYMENT_TYPES = [
    { value: "Monthly", label: "Aylık" },
    { value: "Yearly", label: "Yıllık" },
];

const CURRENCIES = [
    { value: "TL", label: "₺" },
    { value: "USD", label: "$" },
    { value: "EUR", label: "€" },
];

const DURATIONS = [
    { value: "1month", label: "1 Ay" },
    { value: "6months", label: "6 Ay" },
    { value: "1year", label: "1 Yıl" },
    { value: "2years", label: "2 Yıl" },
    { value: "3years", label: "3 Yıl" },
    { value: "unlimited", label: "Sınırsız" },
    { value: "custom", label: "Özel" },
];

const EXTENSION_PERIODS = [
    { value: "1month", label: "1 Ay Ekle" },
    { value: "6months", label: "6 Ay Ekle" },
    { value: "1year", label: "1 Yıl Ekle" },
];

const INITIAL_FORM_STATE = {
    name: "",
    description: "",
    customerID: "",
    paymentType: "1year",
    periodPrice: "",
    currency: "TL",
    startingDate: new Date(),
    endingDate: (() => {
        const defaultEnd = new Date();
        defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
        return defaultEnd;
    })(),
};

export function ServiceModal2({
    visible,
    onClose,
    onSubmit,
    isLoading = false,
    selectedService,
    customers = [],
}) {
    const [isCustomersLoading, setIsCustomersLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [searchQuery, setSearchQuery] = useState("");
    const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false);
    const [startDateMonth, setStartDateMonth] = useState(new Date());
    const [endDateMonth, setEndDateMonth] = useState(new Date());
    const [selectedDuration, setSelectedDuration] = useState("1year");

    useEffect(() => {
        if (visible && selectedService) {
            const paymentType = selectedService.paymentType;
            const isCustom = !DURATIONS.some(d => d.value === paymentType);

            const startingDate = selectedService.startingDate
                ? (selectedService.startingDate instanceof Date
                    ? selectedService.startingDate
                    : new Date(selectedService.startingDate))
                : new Date();

            const endingDate = selectedService.endingDate
                ? (selectedService.endingDate instanceof Date
                    ? selectedService.endingDate
                    : new Date(selectedService.endingDate))
                : (() => {
                    const defaultEnd = new Date(startingDate);
                    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
                    return defaultEnd;
                })();

            setFormData({
                ...selectedService,
                periodPrice: selectedService.periodPrice?.toString() || "",
                startingDate: startingDate,
                endingDate: endingDate,
                paymentType: isCustom ? "custom" : paymentType
            });

            setStartDateMonth(startingDate);
            setEndDateMonth(endingDate);
            setSelectedDuration(isCustom ? "custom" : paymentType);
        } else {
            setFormData({
                ...INITIAL_FORM_STATE,
                paymentType: "1year",
            });
            setSelectedDuration("1year");
        }
    }, [visible, selectedService]);

    useEffect(() => {
        if (selectedDuration !== "custom" && formData.startingDate) {
            const start = new Date(formData.startingDate);
            const end = new Date(start);

            switch (selectedDuration) {
                case "1month":
                    end.setMonth(end.getMonth() + 1);
                    break;
                case "6months":
                    end.setMonth(end.getMonth() + 6);
                    break;
                case "1year":
                    end.setFullYear(end.getFullYear() + 1);
                    break;
                case "2years":
                    end.setFullYear(end.getFullYear() + 2);
                    break;
                case "3years":
                    end.setFullYear(end.getFullYear() + 3);
                    break;
                case "unlimited":
                    end.setFullYear(end.getFullYear() + 100); // Set 100 years in the future for "unlimited"
                    break;
            }

            setFormData((prev) => {
                const currentEndTime = prev.endingDate ? prev.endingDate.getTime() : null;
                const newEndTime = end.getTime();

                if (currentEndTime === newEndTime) {
                    return prev;
                }
                return { ...prev, endingDate: end };
            });

            setEndDateMonth(end);
        }
    }, [selectedDuration, formData.startingDate]);

    const handleExtendService = (extensionPeriod) => {
        const end = new Date(formData.endingDate);

        switch (extensionPeriod) {
            case "1month":
                end.setMonth(end.getMonth() + 1);
                break;
            case "6months":
                end.setMonth(end.getMonth() + 6);
                break;
            case "1year":
                end.setFullYear(end.getFullYear() + 1);
                break;
        }

        setFormData((prev) => ({
            ...prev,
            endingDate: end,
            paymentType: "custom"
        }));
        setSelectedDuration("custom");
        setEndDateMonth(end);
    };

    const handleChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.startingDate || !formData.endingDate || !formData.customerID) {
            alert("Lütfen tüm zorunlu alanları doldurun");
            return;
        }

        if (formData.startingDate > formData.endingDate) {
            alert("Bitiş tarihi başlangıç tarihinden sonra olmalıdır");
            return;
        }

        try {
            await onSubmit({
                ...formData,
                periodPrice: parseFloat(formData.periodPrice) || 0,
            });
            onClose();
            setFormData(INITIAL_FORM_STATE);
        } catch (error) {
            console.error("Gönderim hatası:", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
        }
    };

    const selectedCustomer = customers.find((c) => c.id === formData.customerID);

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-3xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        {selectedService ? "Hizmeti Düzenle" : "Yeni Hizmet Oluştur"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 sm:gap-6 py-2 sm:py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="text-left sm:text-right">
                            Müşteri <span className="text-red-500">*</span>
                        </Label>
                        <Popover open={openCustomerCombobox} onOpenChange={setOpenCustomerCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full sm:col-span-3 justify-between"
                                >
                                    {selectedCustomer ? selectedCustomer.name : "Müşteri seçin..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 pointer-events-auto">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Müşteri ara..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList>
                                        {isCustomersLoading ? (
                                            <div className="py-6 text-center text-sm">
                                                <BeatLoader size={8} className="inline-block" />
                                            </div>
                                        ) : (
                                            <CommandGroup>
                                                {customers
                                                    .filter((customer) =>
                                                        customer.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
                                                    )
                                                    .map((customer) => (
                                                        <CommandItem
                                                            key={customer.id}
                                                            value={customer.id}
                                                            onSelect={() => {
                                                                handleChange("customerID", customer.id);
                                                                setOpenCustomerCombobox(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.customerID === customer.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {customer.name}
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        )}
                                        <CommandEmpty>Müşteri bulunamadı</CommandEmpty>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="name" className="text-left sm:text-right">
                            Hizmet Adı <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full sm:col-span-3"
                            placeholder="Hizmet adını girin"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="description" className="text-left sm:text-right">
                            Açıklama
                        </Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full sm:col-span-3"
                            placeholder="Hizmet açıklaması girin"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label className="text-left sm:text-right">Fiyat</Label>
                        <div className="w-full sm:col-span-3 flex flex-col sm:flex-row gap-2">
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.periodPrice}
                                onChange={(e) => handleChange("periodPrice", e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full"
                                placeholder="0.00"
                            />
                            <Select
                                value={formData.currency}
                                onValueChange={(value) => handleChange("currency", value)}
                            >
                                <SelectTrigger className="w-full sm:w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((currency) => (
                                        <SelectItem key={currency.value} value={currency.value}>
                                            {currency.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                        <Label className="text-left sm:text-right sm:pt-2">
                            Tarihler <span className="text-red-500">*</span>
                        </Label>
                        <div className="w-full sm:col-span-3 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label className="text-left sm:text-right">Ödeme Tipi</Label>
                                <Select
                                    value={formData.paymentType}
                                    onValueChange={(value) => {
                                        handleChange("paymentType", value);
                                        setSelectedDuration(value);
                                    }}
                                >
                                    <SelectTrigger className="w-full sm:col-span-3">
                                        <SelectValue placeholder="Süre seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DURATIONS.map((duration) => (
                                            <SelectItem key={duration.value} value={duration.value}>
                                                {duration.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedService && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label className="text-left sm:text-right">Süre Uzatma</Label>
                                    <Select
                                        onValueChange={handleExtendService}
                                    >
                                        <SelectTrigger className="w-full sm:col-span-3">
                                            <SelectValue placeholder="Süre uzatmak için seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXTENSION_PERIODS.map((period) => (
                                                <SelectItem key={period.value} value={period.value}>
                                                    {period.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col gap-2 w-full">
                                    <Label>
                                        Başlangıç Tarihi <span className="text-red-500">*</span>
                                    </Label>
                                    <Calendar
                                        mode="single"
                                        selected={formData.startingDate}
                                        onSelect={(date) => {
                                            handleChange("startingDate", date);
                                            handleChange("paymentType", "custom");
                                            setSelectedDuration("custom");
                                        }}
                                        month={startDateMonth}
                                        onMonthChange={setStartDateMonth}
                                        className="rounded-md border w-full"
                                        // disabled={(date) => date < formData.startingDate}
                                        locale={tr}
                                        formatters={{
                                            formatCaption: (date, options) => {
                                                return format(date, "MMMM yyyy", { locale: tr });
                                            },
                                            formatDay: (date) => {
                                                return format(date, "dd", { locale: tr });
                                            }
                                        }}
                                        required
                                    />
                                    <div className="text-sm text-gray-500 mt-1">
                                        {formData.startingDate && format(formData.startingDate, "dd/MM/yyyy")}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <Label>
                                        Bitiş Tarihi <span className="text-red-500">*</span>
                                    </Label>
                                    <Calendar
                                        mode="single"
                                        selected={formData.endingDate}
                                        onSelect={(date) => {
                                            handleChange("endingDate", date);
                                            handleChange("paymentType", "custom");
                                            setSelectedDuration("custom");
                                        }}
                                        month={endDateMonth}
                                        onMonthChange={setEndDateMonth}
                                        className="rounded-md border w-full"
                                        disabled={(date) => date < formData.startingDate}
                                        locale={tr}
                                        formatters={{
                                            formatCaption: (date, options) => {
                                                return format(date, "MMMM yyyy", { locale: tr });
                                            },
                                            formatDay: (date) => {
                                                return format(date, "dd", { locale: tr });
                                            }
                                        }}
                                        required
                                    />
                                    <div className="text-sm text-gray-500 mt-1">
                                        {formData.endingDate && format(formData.endingDate, "dd/MM/yyyy")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="w-full sm:w-auto"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <BeatLoader size={8} color="white" />
                        ) : (
                            selectedService ? "Değişiklikleri Kaydet" : "Hizmet Oluştur"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}