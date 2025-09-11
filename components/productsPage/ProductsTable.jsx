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
import { Edit, Trash2, ChevronDown, ChevronUp, Info, Copy, X, Search } from 'lucide-react'
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { copyToClipboard } from '@/lib/clipboard'

const statusColors = {
    AVAILABLE: 'bg-green-500/20 text-green-600 dark:text-green-400',
    SOLD: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    RENTED: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    MAINTENANCE: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    DAMAGED: 'bg-red-500/20 text-red-600 dark:text-red-400',
    RESERVED: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
}

const statusLabels = {
    AVAILABLE: 'Mevcut',
    SOLD: 'Satıldı',
    RENTED: 'Kiralandı',
    MAINTENANCE: 'Bakımda',
    DAMAGED: 'Hasarlı',
    RESERVED: 'Rezerve',
}

const categoryColors = {
    'Bilgisayar': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Yazarkasa': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Termal Printer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Tartı': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'Mini Ekran': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'POS Terminal': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Scanner': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'Tablet': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'Kasa Çekmecesi': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Diğer': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

export function ProductsTable({
    products,
    customers,
    onEdit,
    onDelete,
    isLoading = false,
    sortBy,
    sortOrder,
    onSort,
    searchTerm,
    onSearchChange,
    onSearch,
    statusFilter,
    onStatusChange,
    categoryFilter,
    onCategoryChange,
    brandFilter,
    onBrandChange,
    onClearFilters
}) {
    // Get unique categories and brands from products
    const availableCategories = [...new Set(products.map(product => product.category || 'Bilgisayar'))]
    const availableBrands = [...new Set(products.map(product => product.brand).filter(Boolean))]

    const handleSort = (key) => {
        if (onSort) {
            onSort(key)
        }
    }

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ChevronDown className="h-4 w-4 opacity-30" />
        return sortOrder === 'asc'
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
    }

    return (
        <TooltipProvider>
            <div className="space-y-4 relative">
                <div className="flex gap-2 flex-wrap items-center">
                    <div className="flex gap-1 max-w-sm">
                        <Input
                            placeholder="Ürün ara (ID, ad, marka, model, seri no...)..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
                            className="focus-visible:ring-2"
                        />
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onSearch?.()}
                            className="px-3"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Duruma göre filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="AVAILABLE">Mevcut</SelectItem>
                            <SelectItem value="SOLD">Satıldı</SelectItem>
                            <SelectItem value="RENTED">Kiralandı</SelectItem>
                            <SelectItem value="MAINTENANCE">Bakımda</SelectItem>
                            <SelectItem value="DAMAGED">Hasarlı</SelectItem>
                            <SelectItem value="RESERVED">Rezerve</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={onCategoryChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Kategoriye göre filtrele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Kategoriler</SelectItem>
                            {availableCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {availableBrands.length > 0 && (
                        <Select value={brandFilter} onValueChange={onBrandChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Markaya göre filtrele" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Markalar</SelectItem>
                                {availableBrands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>
                                        {brand}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Clear Filters Button */}
                    {(statusFilter !== 'all' || categoryFilter !== 'all' || brandFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        onClick={onClearFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Filtreleri Temizle
                      </Button>
                    )}
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
                                        Ürün Adı
                                        <SortIcon column="name" />
                                    </div>
                                </TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Kategori
                                        <SortIcon column="category" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('brand')}
                                >
                                    <div className="flex items-center gap-1">
                                        Marka/Model
                                        <SortIcon column="brand" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('serialNumber')}
                                >
                                    <div className="flex items-center gap-1">
                                        Seri No
                                        <SortIcon column="serialNumber" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('purchasePrice')}
                                >
                                    <div className="flex items-center gap-1">
                                        Alış Fiyatı
                                        <SortIcon column="purchasePrice" />
                                    </div>
                                </TableHead>
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
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Durum
                                        <SortIcon column="status" />
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
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {products.map((product) => {
                                const customer = product.customer || customers.find(c => c.id === product.customerID)

                                return (
                                    <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs">
                                                    {product.id}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(product.id.toString(), "Ürün ID kopyalandı!")}
                                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            {product.description ? (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-[300px]">{product.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                className={`text-xs font-medium ${categoryColors[product.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}
                                            >
                                                {product.category || 'Bilgisayar'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {product.brand && (
                                                    <span className="font-medium">{product.brand}</span>
                                                )}
                                                {product.model && (
                                                    <span className="text-sm text-muted-foreground">{product.model}</span>
                                                )}
                                                {!product.brand && !product.model && '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {product.serialNumber ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">{product.serialNumber}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(product.serialNumber, "Seri numarası kopyalandı!")}
                                                        className="h-6 w-6 p-0 hover:bg-gray-100"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {product.purchasePrice ? (
                                                <span className="font-medium">
                                                    {product.purchasePrice.toFixed(2)} ₺
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{customer?.name || (product.customerID ? 'Bilinmeyen Müşteri' : '-')}</TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[product.status]} rounded-md px-2 py-1 text-xs font-medium`}>
                                                {statusLabels[product.status] || product.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <time className="text-sm">
                                                {product.createdAt ? format(new Date(product.createdAt), 'dd/MM/yyyy') : '-'}
                                            </time>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(product)}
                                                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(product)}
                                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
