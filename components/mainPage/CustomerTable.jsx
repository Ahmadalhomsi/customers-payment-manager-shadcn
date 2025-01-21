import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Plus, Eye } from 'lucide-react'

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onAddService,
  onViewServices,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Add these sample statuses to your customer data
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = Object.values(customer).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesStatus = statusFilter === 'all' ||
        customer.status?.toLowerCase() === statusFilter;

      const matchesPayment = paymentFilter === 'all' ||
        customer.paymentStatus?.toLowerCase() === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table className="border rounded-lg">
        <TableHeader className="bg-gray-50 dark:bg-gray-800">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredCustomers.map((customer, index) => (
            <TableRow
              key={customer.id}
              className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
            >
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>
                <Badge className={statusColors[customer.status] || 'bg-gray-100'}>
                  {customer.status || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>
                <Badge variant={customer.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                  {customer.paymentStatus || 'unpaid'}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(customer)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onAddService(customer)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onViewServices(customer)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}