import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Button } from '@/components/ui/button'
  import { Edit, Trash2, Plus, Eye } from 'lucide-react'
  
  export function CustomerTable({
    customers,
    loading,
    sortConfig,
    setSortConfig,
    onEdit,
    onDelete,
    onAddService,
    onViewServices,
  }) {

    const sortedCustomers = sortConfig ? sortData(customers, sortConfig) : customers;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('name')}>
              Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('email')}>
              Email {sortConfig?.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead onClick={() => handleSort('phone')}>
              Phone {sortConfig?.key === 'phone' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCustomers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>{customer.phone}</TableCell>
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
    )
  }