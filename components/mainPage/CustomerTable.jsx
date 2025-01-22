import { useState } from 'react';
import { BeatLoader } from 'react-spinners';
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
import { Edit, Trash2, Plus, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onAddService,
  onViewServices,
  isLoading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const togglePasswordVisibility = (customerId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronDown className="h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const sortCustomers = (customers) => {
    if (!sortConfig.key) return customers;

    return [...customers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle status sorting
      if (sortConfig.key === 'status') {
        aValue = getCustomerStatus(a);
        bValue = getCustomerStatus(b);
      }

      // Case-insensitive string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const statusColors = {
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    inactive: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
    overdue: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  const actionButtonColors = {
    edit: 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400',
    delete: 'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400',
    add: 'hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400',
    view: 'hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 dark:hover:text-purple-400',
  };

  const getCustomerStatus = (customer) => {
    const today = new Date();
    let hasActive = false;
    let hasOverdue = false;

    if (customer.services?.length > 0) {
      for (const service of customer.services) {
        const startDate = new Date(service.startingDate);
        const endDate = new Date(service.endingDate);

        if (startDate <= today && today <= endDate) hasActive = true;
        if (endDate < today) hasOverdue = true;
      }
    }

    if (hasActive) return 'active';
    if (hasOverdue) return 'overdue';
    return 'inactive';
  };

  const filteredCustomers = sortCustomers(
    customers.filter(customer => {
      const matchesSearch = Object.values(customer).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const status = getCustomerStatus(customer);
      return matchesSearch && (statusFilter === 'all' || status === statusFilter);
    })
  );

  return (
    <div className="space-y-4 relative">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs focus-visible:ring-2"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative rounded-lg border shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <BeatLoader color="#f26000" className="opacity-75" />
          </div>
        )}

        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead 
                className="w-[200px] cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon column="status" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  <SortIcon column="email" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center gap-1">
                  Phone
                  <SortIcon column="phone" />
                </div>
              </TableHead>
              <TableHead className="w-[200px]">Password</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCustomers.map((customer) => {
              const status = getCustomerStatus(customer);
              return (
                <TableRow
                  key={customer.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${statusColors[status]} rounded-md px-2 py-1 text-xs font-medium`}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground/80">{customer.email}</TableCell>
                  <TableCell className="text-foreground/80">{customer.phone}</TableCell>
                  <TableCell className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {visiblePasswords[customer.id] ? customer.password : '••••••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(customer.id)}
                        className="h-6 w-6 p-0 hover:bg-foreground/10"
                      >
                        {visiblePasswords[customer.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(customer)}
                      className={`h-8 w-8 p-0 ${actionButtonColors.edit}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(customer)}
                      className={`h-8 w-8 p-0 ${actionButtonColors.delete}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddService(customer)}
                      className={`h-8 w-8 p-0 ${actionButtonColors.add}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewServices(customer)}
                      className={`h-8 w-8 p-0 ${actionButtonColors.view}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}