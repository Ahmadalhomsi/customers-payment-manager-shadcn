import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { BeatLoader } from 'react-spinners';

const PAYMENT_TYPES = [
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
]

const CURRENCIES = [
  { value: "TL", label: "₺" },
  { value: "USD", label: "$" },
  { value: "EUR", label: "€" },
]

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  paymentType: "Monthly",
  periodPrice: '',
  currency: "TL",
  startingDate: null,
  endingDate: null,
}

export function ServiceModal({
  visible,
  onClose,
  onSubmit,
  selectedCustomer,
  selectedService,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [startDateMonth, setStartDateMonth] = useState(new Date())
  const [endDateMonth, setEndDateMonth] = useState(new Date())

  useEffect(() => {
    if (selectedService) {
      const startingDate = new Date(selectedService.startingDate)
      const endingDate = selectedService.endingDate ? new Date(selectedService.endingDate) : null

      setFormData({
        ...selectedService,
        startingDate,
        endingDate,
      })

      setStartDateMonth(startingDate)
      if (endingDate) {
        setEndDateMonth(endingDate)
      }
    } else {
      setFormData(INITIAL_FORM_STATE)
      setStartDateMonth(new Date())
      setEndDateMonth(new Date())
    }
  }, [selectedService])

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.startingDate) {
      alert("Please fill in required fields")
      return
    }

    if (formData.endingDate && formData.startingDate > formData.endingDate) {
      alert("End date must be after start date")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {selectedService ? "Edit" : "Add"} Service for{" "}
            <span className="font-semibold">{selectedCustomer?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:gap-6 py-2 sm:py-4">
          {/* Service Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="text-left sm:text-right">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full sm:col-span-3"
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="description" className="text-left sm:text-right">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full sm:col-span-3"
              placeholder="Enter service description"
            />
          </div>

          {/* Payment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label className="text-left sm:text-right">Payment Type</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) => handleChange("paymentType", value)}
            >
              <SelectTrigger className="w-full sm:col-span-3">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label className="text-left sm:text-right">Price</Label>
            <div className="w-full sm:col-span-3 flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.periodPrice || ""}
                onChange={(e) =>
                  handleChange("periodPrice", parseFloat(e.target.value) || 0)
                }
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

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
            <Label className="text-left sm:text-right sm:pt-2">
              Dates <span className="text-red-500">*</span>
            </Label>
            <div className="w-full sm:col-span-3 flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label>Start Date</Label>
                <Calendar
                  mode="single"
                  selected={formData.startingDate}
                  onSelect={(date) => handleChange("startingDate", date)}
                  month={startDateMonth}
                  onMonthChange={setStartDateMonth}
                  className="rounded-md border w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Label>End Date</Label>
                <Calendar
                  mode="single"
                  selected={formData.endingDate}
                  onSelect={(date) => handleChange("endingDate", date)}
                  month={endDateMonth}
                  onMonthChange={setEndDateMonth}
                  className="rounded-md border w-full"
                  disabled={(date) =>
                    date < formData.startingDate
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <BeatLoader
                color="#ffffff"
                size={8}
                className="py-1"
              />
            ) : selectedService ? "Update Service" : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ServiceModal