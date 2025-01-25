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
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const FormField = ({ label, id, ...props }) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor={id} className="text-right">
      {label}
    </Label>
    <div className="col-span-3">
      {props.children ? props.children : <Input id={id} {...props} />}
    </div>
  </div>
);

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    allValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
  };
};

export function CustomerModal({ visible, onClose, onSubmit, selectedCustomer, customers }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    allValid: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      // Pre-fill the form with the selected customer's data, including the actual password
      setFormData(
        selectedCustomer
          ? { ...selectedCustomer } // Include the actual password
          : { name: "", email: "", phone: "", password: "" }
      );
      setPasswordValidation({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        allValid: false,
      });
      setErrors({});
    }
  }, [visible, selectedCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordValidation(validatePassword(value));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (customers.some(c => c.email === formData.email && c.id !== selectedCustomer?.id)) {
      newErrors.email = "Email already exists";
    }

    // Password validation for new customers or when updating password
    if (!selectedCustomer && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.trim()) {
      const passwordValid = validatePassword(formData.password);
      if (!passwordValid.allValid) {
        newErrors.password = "Password does not meet requirements";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    } else {
      toast({
        variant: "destructive",
        title: "Form Validation Failed",
        description: "Please check the form for errors.",
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      handleSubmit();
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onKeyDown={handleKeyDown} // Add keydown handler to the dialog
      >
        <DialogHeader>
          <DialogTitle>
            {selectedCustomer ? "Edit Customer" : "Create Customer"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <FormField
            label="Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onKeyDown={handleKeyDown} // Add keydown handler to input
            required
          />
          {errors.name && <p className="text-destructive text-sm ml-24">{errors.name}</p>}

          <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown} // Add keydown handler to input
            required
          />
          {errors.email && <p className="text-destructive text-sm ml-24">{errors.email}</p>}

          <FormField
            label="Phone"
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            onKeyDown={handleKeyDown} // Add keydown handler to input
          />

          <FormField label="Password" id="password">
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown} // Add keydown handler to input
                className="pr-10"
                required={!selectedCustomer} // Only required for new customers
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                )}
              </Button>
            </div>
            {formData.password && (
              <div className="text-sm mt-2 space-y-1">
                <div className={passwordValidation.minLength ? 'text-green-600' : 'text-destructive'}>
                  • At least 8 characters
                </div>
                <div className={passwordValidation.hasUpper ? 'text-green-600' : 'text-destructive'}>
                  • One uppercase letter
                </div>
                <div className={passwordValidation.hasLower ? 'text-green-600' : 'text-destructive'}>
                  • One lowercase letter
                </div>
                <div className={passwordValidation.hasNumber ? 'text-green-600' : 'text-destructive'}>
                  • One number
                </div>
                <div className={passwordValidation.hasSpecial ? 'text-green-600' : 'text-destructive'}>
                  • One special character
                </div>
              </div>
            )}
            {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
          </FormField>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {selectedCustomer ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>  
    </Dialog>
  );
}