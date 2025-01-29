// app/admins/page.js
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";


export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    active: true,
    permissions: {
      canViewCustomers: false,
      canEditCustomers: false,
      canViewServices: false,
      canEditServices: false,
      canViewReminders: false,
      canEditReminders: false,
      canViewAdmins: false,
      canEditAdmins: false,
      canSendEmails: false,
      canSeePasswords: false,
    },
  });

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admins");
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch admins",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingAdmin
        ? `/api/admins?id=${editingAdmin.id}`
        : "/api/admins";
      const method = editingAdmin ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save admin");

      toast({
        title: "Success",
        description: `Admin ${editingAdmin ? "updated" : "created"} successfully`,
      });

      setIsDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin deletion
  const handleDelete = async (admin) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const response = await fetch(`/api/admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id }),
      });

      if (!response.ok) throw new Error("Failed to delete admin");

      toast({
        title: "Success",
        description: "Admin deleted successfully",
      });

      fetchAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Reset form and open dialog for new admin
  const handleAddNew = () => {
    setEditingAdmin(null);
    setFormData({
      username: "",
      name: "",
      password: "",
      active: true,
      permissions: {
        canViewCustomers: false,
        canEditCustomers: false,
        canViewServices: false,
        canEditServices: false,
        canViewReminders: false,
        canEditReminders: false,
        canViewAdmins: false,
        canEditAdmins: false,
        canSendEmails: false,
        canSeePasswords: false,
      },
    });
    setIsDialogOpen(true);
  };

  // Open dialog with admin data for editing
  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      name: admin.name,
      password: "", // Don't show existing password
      active: admin.active,
      permissions: {
        canViewCustomers: admin.canViewCustomers,
        canEditCustomers: admin.canEditCustomers,
        canViewServices: admin.canViewServices,
        canEditServices: admin.canEditServices,
        canViewReminders: admin.canViewReminders,
        canEditReminders: admin.canEditReminders,
        canViewAdmins: admin.canViewAdmins,
        canEditAdmins: admin.canEditAdmins,
        canSendEmails: admin.canSendEmails,
        canSeePasswords: admin.canSeePasswords,
      },
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Management</h1>
        <Button onClick={handleAddNew}>Add New Admin</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.username}</TableCell>
              <TableCell>{admin.name}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    admin.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {admin.active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(admin)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(admin)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? "Edit Admin" : "Create New Admin"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Username</label>
                <Input
                  className="col-span-3"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Name</label>
                <Input
                  className="col-span-3"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Password</label>
                <Input
                  className="col-span-3"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingAdmin}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Active</label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Permissions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [key]: checked,
                            },
                          })
                        }
                      />
                      <label>{key.replace(/([A-Z])/g, " $1").trim()}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}