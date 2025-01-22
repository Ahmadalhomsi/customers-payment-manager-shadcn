import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { Eye } from "lucide-react";

export function CustomerModal({ visible, onClose, onSubmit, selectedCustomer }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (visible) {
      setFormData(selectedCustomer ? {
        ...selectedCustomer,
        password: '' // Clear password for security unless you want to show it
      } : { name: '', email: '', phone: '', password: '' });
    }
  }, [visible, selectedCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedCustomer ? 'Edit Customer' : 'Create Customer'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Password
          </Label>
          <div className="col-span-3 flex items-center gap-2">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="h-8 w-8 p-0 hover:bg-foreground/10"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
