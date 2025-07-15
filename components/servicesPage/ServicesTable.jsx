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
import { Edit, Trash2, Eye, ChevronDown, ChevronUp, Info, Key } from 'lucide-react'
import { format } from "date-fns"
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import { tr } from 'date-fns/locale'

const statusColors = {
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    upcoming: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    expired: 'bg-red-500/20 text-red-600 dark:text-red-400',
    inactive: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
    notStarted: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
}

const paymentTypeColors = {
    '1month': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    '6months': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    '1year': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    '2years': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    '3years': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'unlimited': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

const paymentTypeLabels = {
    '1month': '1 Ay',
    '6months': '6 Ay',
    '1year': '1 Yıl',
    '2years': '2 Yıl',
    '3years': '3 Yıl',
    'unlimited': 'Sınırsız',
    'custom': 'Özel'
}

export function ServiceTable({
    services,
    customers,
    onEdit,
    onDelete,
    isLoading = false,
    onViewHistory,
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortConfig, setSortConfig] = useState(null)
    const [dateRangeFilter, setDateRangeFilter] = useState()
    const [endDateRangeFilter, setEndDateRangeFilter] = useState()

    // Check if any service has a deviceToken
    const hasDeviceTokens = services.some(service => service.deviceToken);

    const getServiceStatus = (service) => {
        // First check if the service is explicitly set as inactive
        if (service.active === false) return 'inactive'
        
        const today = new Date()
        const startDate = new Date(service.startingDate)
        const endDate = new Date(service.endingDate)

        // If service hasn't started yet, it's not started
        if (today < startDate) {
            return 'notStarted'
        }
        
        // If service has already expired, it's expired
        if (today > endDate) {
            return 'expired'
        }
        
        // Check if service is expiring within 1 month (30 days)
        const oneMonthFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
        
        if (endDate <= oneMonthFromNow) {
            return 'upcoming'
        }
        
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
        const key = sortConfig.key
        const aValue = a[key]
        const bValue = b[key]

        if (key === 'paymentType') {
            const paymentOrder = ['6months', '1year', '2years', '3years', 'custom']
            const aIndex = paymentOrder.indexOf(aValue)
            const bIndex = paymentOrder.indexOf(bValue)
            const aOrder = aIndex === -1 ? paymentOrder.length : aIndex
            const bOrder = bIndex === -1 ? paymentOrder.length : bIndex

            return sortConfig.direction === 'asc'
                ? aOrder - bOrder
                : bOrder - aOrder
        }

        if (key === 'deviceToken') {
            const aHasToken = !!aValue;
            const bHasToken = !!bValue;
            
            if (aHasToken === bHasToken) {
                return sortConfig.direction === 'asc'
                    ? (aValue || '').localeCompare(bValue || '')
                    : (bValue || '').localeCompare(aValue || '');
            }
            
            return sortConfig.direction === 'asc'
                ? (aHasToken ? 1 : -1)
                : (aHasToken ? -1 : 1);
        }

        if (typeof aValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    })

    const filteredServices = sortedServices.filter(service => {
        const customer = customers.find(c => c.id === service.customerID);
        const matchesSearch =
            service.name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) ||
            (customer?.name && customer.name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))) ||
            (service.deviceToken && service.deviceToken.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')));

        const status = getServiceStatus(service);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        let matchesStartDate = true;
        if (dateRangeFilter) {
            const { from, to } = dateRangeFilter;
            const serviceStart = new Date(service.startingDate);

            if (from && to) {
                matchesStartDate = serviceStart >= from && serviceStart <= to;
            } else if (from) {
                matchesStartDate = serviceStart >= from;
            } else if (to) {
                matchesStartDate = serviceStart <= to;
            }
        }

        let matchesEndDate = true;
        if (endDateRangeFilter) {
            const { from, to } = endDateRangeFilter;
            const serviceEnd = new Date(service.endingDate);

            if (from && to) {
                matchesEndDate = serviceEnd >= from && serviceEnd <= to;
            } else if (from) {
                matchesEndDate = serviceEnd >= from;
            } else if (to) {
                matchesEndDate = serviceEnd <= to;
            }
        }

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });


    return (
        <TooltipProvider>
            <div className="space-y-4 relative">
                <div className="flex gap-2 flex-wrap items-center">
                    <Input
                        placeholder="Hizmetleri ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs focus-visible:ring-2"
                    />

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Duruma göre filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="upcoming">Yaklaşan</SelectItem>
                            <SelectItem value="notStarted">Başlamadı</SelectItem>
                            <SelectItem value="expired">Süresi Dolmuş</SelectItem>
                            <SelectItem value="inactive">Pasif</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !dateRangeFilter?.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeFilter?.from ? (
                                    dateRangeFilter.to ? (
                                        <>
                                            {format(dateRangeFilter.from, "dd MMMM yyyy", { locale: tr })} -{" "}
                                            {format(dateRangeFilter.to, "dd MMMM yyyy", { locale: tr })}
                                        </>
                                    ) : (
                                        format(dateRangeFilter.from, "dd MMMM yyyy", { locale: tr })
                                    )
                                ) : (
                                    <span>Başlangıç tarihine göre filtrele</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRangeFilter?.from}
                                selected={dateRangeFilter}
                                onSelect={setDateRangeFilter}
                                numberOfMonths={2}
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>


                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !endDateRangeFilter?.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDateRangeFilter?.from ? (
                                    endDateRangeFilter.to ? (
                                        <>
                                            {format(endDateRangeFilter.from, "dd MMMM yyyy", { locale: tr })} -{" "}
                                            {format(endDateRangeFilter.to, "dd MMMM yyyy", { locale: tr })}
                                        </>
                                    ) : (
                                        format(endDateRangeFilter.from, "dd MMMM yyyy", { locale: tr })
                                    )
                                ) : (
                                    <span>Bitiş tarihine göre filtrele</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={endDateRangeFilter?.from}
                                selected={endDateRangeFilter}
                                onSelect={setEndDateRangeFilter}
                                numberOfMonths={2}
                                locale={tr}
                            />
                        </PopoverContent>
                    </Popover>
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
                                        Hizmet Adı
                                        <SortIcon column="name" />
                                    </div>
                                </TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('customerID')}
                                >
                                    <div className="flex items-center gap-1">
                                        Müşteri
                                        <SortIcon column="customerID" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('paymentType')}
                                >
                                    <div className="flex items-center gap-1">
                                        Ödeme
                                        <SortIcon column="paymentType" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center gap-1">
                                        Oluşturulma Tarihi
                                        <SortIcon column="createdAt" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('startingDate')}
                                >
                                    <div className="flex items-center gap-1">
                                        Tarihler
                                        <SortIcon column="startingDate" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Durum
                                        <SortIcon column="status" />
                                    </div>
                                </TableHead>
                                {hasDeviceTokens && (
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('deviceToken')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Cihaz Token
                                            <SortIcon column="deviceToken" />
                                        </div>
                                    </TableHead>
                                )}
                                <TableHead className="text-right">İşlemler</TableHead>
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
                                        <TableCell>{customer?.name || 'Bilinmeyen Müşteri'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge className={paymentTypeColors[service.paymentType]}>
                                                    {paymentTypeLabels[service.paymentType]}
                                                </Badge>
                                                <span>
                                                    {service.periodPrice?.toFixed(2) || '0.00'} {service.currency}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <time className="text-sm">
                                                {service.createdAt ? format(new Date(service.createdAt), 'dd/MM/yyyy') : '-'}
                                            </time>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <time className="text-sm">
                                                    {format(new Date(service.startingDate), 'dd/MM/yyyy')}
                                                </time>
                                                <time className="text-xs text-muted-foreground">
                                                    {format(new Date(service.endingDate), 'dd/MM/yyyy')}
                                                </time>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[status]} rounded-md px-2 py-1 text-xs font-medium`}>
                                                {status === 'active' ? 'Aktif' : 
                                                 status === 'upcoming' ? 'Yaklaşan' : 
                                                 status === 'expired' ? 'Süresi Dolmuş' :
                                                 status === 'inactive' ? 'Pasif' : 
                                                 status === 'notStarted' ? 'Başlamadı' : status}
                                            </Badge>
                                        </TableCell>
                                        {hasDeviceTokens && (
                                            <TableCell>
                                                {service.deviceToken ? (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className="flex items-center gap-1">
                                                                <Key className="h-4 w-4 text-emerald-500" />
                                                                <span className="font-mono text-xs truncate max-w-[120px]">
                                                                    {service.deviceToken.substring(0, 8)}...
                                                                </span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-mono text-xs break-all max-w-[300px]">{service.deviceToken}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : '-'}
                                            </TableCell>
                                        )}
                                        <TableCell className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onViewHistory(service)}
                                                className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
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