import { BeatLoader } from 'react-spinners'
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
import { Edit, Trash2, Eye, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { format } from "date-fns"
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip" // Add TooltipProvider

const statusColors = {
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    upcoming: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    expired: 'bg-red-500/20 text-red-600 dark:text-red-400',
}

const paymentTypeColors = {
    Yearly: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Monthly: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
}

export function ServiceTable({
    services,
    customers,
    onEdit,
    onDelete,
    isLoading = false
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortConfig, setSortConfig] = useState(null)

    const getServiceStatus = (service) => {
        const today = new Date()
        const startDate = new Date(service.startingDate)
        const endDate = new Date(service.endingDate)

        if (today < startDate) return 'upcoming'
        if (today > endDate) return 'expired'
        return 'active'
    }

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
            }
            return { key, direction: 'asc' }
        })
    }

    const SortIcon = ({ column }) => {
        if (sortConfig?.key !== column) return <ChevronDown className="h-4 w-4 opacity-30" />
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
    }

    const sortedServices = [...services].sort((a, b) => {
        if (!sortConfig) return 0
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (typeof aValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    })

    const filteredServices = sortedServices.filter(service => {
        const matchesSearch = Object.values(service).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
        const status = getServiceStatus(service)
        return matchesSearch && (statusFilter === 'all' || status === statusFilter)
    })

    return (
        <TooltipProvider> {/* Wrap component with TooltipProvider */}
            <div className="space-y-4 relative">
                <div className="flex gap-2 flex-wrap items-center">
                    <Input
                        placeholder="Search services..."
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
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
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
                                    className="w-[100px] cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('id')}
                                >
                                    <div className="flex items-center gap-1">
                                        ID
                                        <SortIcon column="id" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Service Name
                                        <SortIcon column="name" />
                                    </div>
                                </TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('customerID')}
                                >
                                    <div className="flex items-center gap-1">
                                        Customer
                                        <SortIcon column="customerID" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('paymentType')}
                                >
                                    <div className="flex items-center gap-1">
                                        Payment
                                        <SortIcon column="paymentType" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('startingDate')}
                                >
                                    <div className="flex items-center gap-1">
                                        Dates
                                        <SortIcon column="startingDate" />
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredServices.map((service) => {
                                const status = getServiceStatus(service)
                                const customer = customers.find(c => c.id === service.customerID)
                                const isActive = status === 'active'

                                return (
                                    <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-mono text-xs">{service.id}</TableCell>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>
                                            {service.description ? (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-[300px]">{service.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{customer?.name || 'Unknown Customer'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge className={paymentTypeColors[service.paymentType]}>
                                                    {service.paymentType}
                                                </Badge>
                                                <span>
                                                    {service.periodPrice?.toFixed(2) || '0.00'} {service.currency}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <time className="text-sm">
                                                    {format(new Date(service.startingDate), 'MMM dd, yyyy')}
                                                </time>
                                                <time className="text-xs text-muted-foreground">
                                                    {format(new Date(service.endingDate), 'MMM dd, yyyy')}
                                                </time>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[status]} rounded-md px-2 py-1 text-xs font-medium`}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(service)}
                                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(service)}
                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    )
}