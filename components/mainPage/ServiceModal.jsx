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
  const [isLoading, setIsLoading] = useState(false) // Add loading state

  useEffect(() => {
    if (selectedService) {
      setFormData({
        ...selectedService,
        startingDate: new Date(selectedService.startingDate),
        endingDate: selectedService.endingDate ? new Date(selectedService.endingDate) : null,
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [selectedService]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    // Validation remains the same
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {selectedService ? "Edit" : "Add"} Service for{" "}
            <span className="font-semibold">{selectedCustomer?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="col-span-3"
              placeholder="Enter service name"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="col-span-3"
              placeholder="Enter service description"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Payment Type</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value) => handleChange("paymentType", value)}
            >
              <SelectTrigger className="col-span-3">
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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Price</Label>
            <div className="col-span-3 flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.periodPrice || ""}
                onChange={(e) =>
                  handleChange("periodPrice", parseFloat(e.target.value) || 0)
                }
                className="flex-1"
                placeholder="0.00"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange("currency", value)}
              >
                <SelectTrigger className="w-24">
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

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Dates <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 flex gap-6">
              <div className="flex flex-col gap-2">
                <Label>Start Date</Label>
                <Calendar
                  mode="single"
                  selected={formData.startingDate}
                  onSelect={(date) => handleChange("startingDate", date)}
                  className="rounded-md border"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End Date</Label>
                <Calendar
                  mode="single"
                  selected={formData.endingDate}
                  onSelect={(date) => handleChange("endingDate", date)}
                  className="rounded-md border"
                  disabled={(date) =>
                    date < formData.startingDate
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
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