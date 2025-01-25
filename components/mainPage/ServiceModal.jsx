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

const PAYMENT_TYPES = [
  { value: "6months", label: "6 Months" },
  { value: "1year", label: "1 Year" },
  { value: "2years", label: "2 Years" },
  { value: "3years", label: "3 Years" },
  { value: "custom", label: "Custom" },
];

const CURRENCIES = [
  { value: "TL", label: "₺" },
  { value: "USD", label: "$" },
  { value: "EUR", label: "€" },
];

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  paymentType: "1year", // Will mirror duration selection
  periodPrice: "",
  currency: "TL",
  startingDate: new Date(),
  endingDate: null,
};

export function ServiceModal({
  visible,
  onClose,
  onSubmit,
  selectedCustomer,
  selectedService,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [startDateMonth, setStartDateMonth] = useState(new Date());
  const [endDateMonth, setEndDateMonth] = useState(new Date());
  const DURATIONS = [
    { value: "6months", label: "6 Months" },
    { value: "1year", label: "1 Year" },
    { value: "2years", label: "2 Years" },
    { value: "3years", label: "3 Years" },
    { value: "custom", label: "Custom" },
  ];

  // Add this state variable
  const [selectedDuration, setSelectedDuration] = useState("1year");

  useEffect(() => {
    if (selectedService) {
      const startingDate = new Date(selectedService.startingDate);
      const endingDate = selectedService.endingDate
        ? new Date(selectedService.endingDate)
        : null;

      // Calculate initial duration
      let duration = "custom";
      if (endingDate) {
        const startYear = startingDate.getFullYear();
        const startMonth = startingDate.getMonth();
        const startDay = startingDate.getDate();

        const endYear = endingDate.getFullYear();
        const endMonth = endingDate.getMonth();
        const endDay = endingDate.getDate();

        // Check for exact duration matches
        if (
          endYear === startYear + 1 &&
          endMonth === startMonth &&
          endDay === startDay
        ) {
          duration = "1year";
        } else if (
          endYear === startYear + 2 &&
          endMonth === startMonth &&
          endDay === startDay
        ) {
          duration = "2years";
        } else if (
          endYear === startYear + 3 &&
          endMonth === startMonth &&
          endDay === startDay
        ) {
          duration = "3years";
        } else {
          const monthsDiff =
            (endYear - startYear) * 12 + (endMonth - startMonth);
          if (monthsDiff === 6 && endDay === startDay) {
            duration = "6months";
          }
        }
      }

      setFormData({
        ...selectedService,
        startingDate,
        endingDate,
      });
      setSelectedDuration(duration);
      setStartDateMonth(startingDate);
      if (endingDate) setEndDateMonth(endingDate);
    } else {
      setFormData(INITIAL_FORM_STATE);
      setStartDateMonth(new Date());
      setEndDateMonth(new Date());
      setSelectedDuration("custom");
    }
  }, [selectedService]);

  // Calculate duration when dates change
  useEffect(() => {
    const calculateDuration = () => {
      if (!formData.startingDate || !formData.endingDate) {
        setSelectedDuration("custom");
        return;
      }

      const start = new Date(formData.startingDate);
      const end = new Date(formData.endingDate);

      // Create test dates for comparison
      const testDates = [
        {
          duration: "6months",
          date: new Date(start).setMonth(start.getMonth() + 6),
        },
        {
          duration: "1year",
          date: new Date(start).setFullYear(start.getFullYear() + 1),
        },
        {
          duration: "2years",
          date: new Date(start).setFullYear(start.getFullYear() + 2),
        },
        {
          duration: "3years",
          date: new Date(start).setFullYear(start.getFullYear() + 3),
        },
      ];

      const match = testDates.find((td) => td.date === end.getTime());
      setSelectedDuration(match ? match.duration : "custom");
    };

    calculateDuration();
  }, [formData.startingDate, formData.endingDate]);

  useEffect(() => {
    if (selectedDuration !== "custom" && formData.startingDate) {
      const start = new Date(formData.startingDate);
      const end = new Date(start);

      switch (selectedDuration) {
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
      }

      setFormData((prev) => ({ ...prev, endingDate: end }));
      setEndDateMonth(end);
    }
  }, [selectedDuration, formData.startingDate]);

  const handleChange = (name, value) => {
    if (name === "endingDate") {
      setSelectedDuration("custom");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update the form validation in handleSubmit
  const handleSubmit = async () => {
    // Add endingDate to required fields check
    if (!formData.name || !formData.startingDate || !formData.endingDate) {
      alert("Please fill in required fields");
      return;
    }

    if (formData.startingDate > formData.endingDate) {
      alert("End date must be after start date");
      return;
    }

    // Rest remains the same
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };



  // Handle "Enter" key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation(); // Add this to prevent event bubbling
      handleSubmit();
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-3xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {selectedService ? "Edit Service" : "Create New Service"}
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
              className="w-full sm:col-span-3"
              placeholder="Enter service description"
            />
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
                onKeyDown={handleKeyDown}
                className="w-full"
                placeholder="0.00"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange("currency", value)}
              >
                <SelectTrigger className="w-full sm:w-24">
                  <SelectValue placeholder="Currency" />
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

          {/* Dates Section */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
            <Label className="text-left sm:text-right sm:pt-2">
              Dates <span className="text-red-500">*</span>
            </Label>
            <div className="w-full sm:col-span-3 space-y-4">
              {/* Payment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label className="text-left sm:text-right">Payment Type</Label>
                <Select
                  value={selectedDuration}
                  onValueChange={(value) => {
                    setSelectedDuration(value);
                    handleChange("paymentType", value);
                  }}
                >
                  <SelectTrigger className="w-full sm:col-span-3">
                    <SelectValue placeholder="Select duration" />
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

              {/* Date Pickers */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <Label>
                    Start Date <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Calendar
                    mode="single"
                    selected={formData.endingDate}
                    onSelect={(date) => handleChange("endingDate", date)}
                    month={endDateMonth}
                    onMonthChange={setEndDateMonth}
                    className="rounded-md border w-full"
                    disabled={(date) => date < formData.startingDate}
                    required
                  />
                </div>
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
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <BeatLoader size={8} color="white" />
            ) : (
              selectedService ? "Save Changes" : "Create Service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceModal;