"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const productCategories = [
    { value: 'Bilgisayar', label: '💻 Bilgisayar', color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200' },
    { value: 'Termal Printer', label: '🖨️ Termal Printer', color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200' },
    { value: 'Tartı', label: '⚖️ Tartı', color: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200' },
    { value: 'Mini Ekran', label: '📟 Mini Ekran', color: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200' },
    { value: 'POS Terminal', label: '💳 POS Terminal', color: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' },
    { value: 'Scanner', label: '📷 Scanner', color: 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200' },
    { value: 'El Terminali', label: '📱 El Terminali', color: 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-200' },
    { value: 'Kasa Çekmecesi', label: '💰 Kasa Çekmecesi', color: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200' },
    { value: 'Diğer', label: '📦 Diğer', color: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200' }
]

const productStatuses = [
    { value: 'AVAILABLE', label: 'Mevcut' },
    { value: 'SOLD', label: 'Satıldı' },
    { value: 'RENTED', label: 'Kiralandı' },
    { value: 'MAINTENANCE', label: 'Bakımda' },
    { value: 'DAMAGED', label: 'Hasarlı' },
    { value: 'RESERVED', label: 'Rezerve' }
]

const conditionOptions = [
    'Yeni',
    'İkinci El',
    'Yenilenmiş',
    'Hasarlı'
]

export function ProductModal({ 
    visible, 
    onClose, 
    onSubmit, 
    selectedProduct
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Bilgisayar',
        brand: '',
        model: '',
        serialNumber: '',
        purchasePrice: '',
        purchaseDate: null,
        supplier: '',
        status: 'AVAILABLE',
        condition: 'Yeni',
        specifications: '',
        warranty: '',
        notes: '',
        location: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (selectedProduct) {
            setFormData({
                name: selectedProduct.name || '',
                description: selectedProduct.description || '',
                category: selectedProduct.category || 'Bilgisayar',
                brand: selectedProduct.brand || '',
                model: selectedProduct.model || '',
                serialNumber: selectedProduct.serialNumber || '',
                purchasePrice: selectedProduct.purchasePrice?.toString() || '',
                purchaseDate: selectedProduct.purchaseDate ? new Date(selectedProduct.purchaseDate) : null,
                supplier: selectedProduct.supplier || '',
                status: selectedProduct.status || 'AVAILABLE',
                condition: selectedProduct.condition || 'Yeni',
                specifications: selectedProduct.specifications || '',
                warranty: selectedProduct.warranty || '',
                notes: selectedProduct.notes || '',
                location: selectedProduct.location || ''
            })
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'Bilgisayar',
                brand: '',
                model: '',
                serialNumber: '',
                purchasePrice: '',
                purchaseDate: null,
                supplier: '',
                status: 'AVAILABLE',
                condition: 'Yeni',
                specifications: '',
                warranty: '',
                notes: '',
                location: ''
            })
        }
    }, [selectedProduct, visible])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.category.trim()) {
            toast.error('Ürün kategorisi zorunludur')
            return
        }

        setIsSubmitting(true)
        
        try {
            await onSubmit(formData)
        } catch (error) {
            console.error('Submit error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!visible) return null

    return (
            <Dialog open={visible} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Category - Primary Focus */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-semibold border-b pb-2 text-primary">🏷️ Ürün Türü (Zorunlu)</h3>
                                
                                <div>
                                    <Label htmlFor="category" className="text-base font-semibold">Kategori *</Label>
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                        <SelectTrigger className="h-12 text-lg border-2 focus:border-primary">
                                            <SelectValue placeholder="Ürün kategorisini seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productCategories.map((category) => (
                                                <SelectItem 
                                                    key={category.value} 
                                                    value={category.value}
                                                    className={`p-3 m-1 rounded-md ${category.color} hover:opacity-80 cursor-pointer`}
                                                >
                                                    <span className="text-lg">{category.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="brand" className="text-base font-medium">Marka</Label>
                                        <Input
                                            id="brand"
                                            value={formData.brand}
                                            onChange={(e) => handleInputChange('brand', e.target.value)}
                                            placeholder="Beko, Inpos, Hugin, Paycell..."
                                            className="h-10"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="model" className="text-base font-medium">Model</Label>
                                        <Input
                                            id="model"
                                            value={formData.model}
                                            onChange={(e) => handleInputChange('model', e.target.value)}
                                            placeholder="Model numarası"
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">📝 Temel Bilgiler</h3>
                                
                                <div>
                                    <Label htmlFor="name">Ürün Adı (Opsiyonel)</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Boş bırakılırsa otomatik oluşturulur"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Örnek: {formData.category} - {formData.brand || 'Bilinmeyen'} {formData.model || ''}
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="description">Açıklama</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Ürün açıklaması"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="serialNumber">Seri Numarası</Label>
                                    <Input
                                        id="serialNumber"
                                        value={formData.serialNumber}
                                        onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                                        placeholder="Seri numarası"
                                    />
                                </div>
                            </div>

                            {/* Purchase and Status Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">💰 Satın Alma ve Durum</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="status" className="text-base font-medium">Durum *</Label>
                                        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                            <SelectTrigger className="h-10 border-2 focus:border-primary">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {productStatuses.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="condition" className="text-base font-medium">Kondisyon</Label>
                                        <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                                            <SelectTrigger className="h-10 border-2 focus:border-primary">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {conditionOptions.map((condition) => (
                                                    <SelectItem key={condition} value={condition}>
                                                        {condition}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div>
                                    <Label htmlFor="purchasePrice" className="text-base font-medium">Satış Fiyatı (₺)</Label>
                                    <div className="relative">
                                        <Input
                                            id="purchasePrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.purchasePrice}
                                            onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                            placeholder="0,00"
                                            className="h-10 text-right pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₺</span>
                                    </div>
                                    {formData.purchasePrice && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Intl.NumberFormat('tr-TR', { 
                                                style: 'currency', 
                                                currency: 'TRY' 
                                            }).format(parseFloat(formData.purchasePrice) || 0)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Satın Alma Tarihi</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.purchaseDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.purchaseDate ? (
                                                    format(formData.purchaseDate, "dd MMMM yyyy", { locale: tr })
                                                ) : (
                                                    <span>Tarih seçin</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.purchaseDate}
                                                onSelect={(date) => handleInputChange('purchaseDate', date)}
                                                initialFocus
                                                locale={tr}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div>
                                    <Label htmlFor="supplier">Tedarikçi</Label>
                                    <Input
                                        id="supplier"
                                        value={formData.supplier}
                                        onChange={(e) => handleInputChange('supplier', e.target.value)}
                                        placeholder="Tedarikçi adı"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="location">Konum</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        placeholder="Depo, ofis, vs."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">📋 Ek Bilgiler</h3>
                            
                            <div>
                                <Label htmlFor="specifications">Teknik Özellikler</Label>
                                <Textarea
                                    id="specifications"
                                    value={formData.specifications}
                                    onChange={(e) => handleInputChange('specifications', e.target.value)}
                                    placeholder="Teknik özellikler, işlemci, RAM, vs."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="warranty">Garanti Bilgisi</Label>
                                <Input
                                    id="warranty"
                                    value={formData.warranty}
                                    onChange={(e) => handleInputChange('warranty', e.target.value)}
                                    placeholder="2 yıl garanti, vs."
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notlar</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Ek notlar"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Kaydediliyor...' : (selectedProduct ? 'Güncelle' : 'Ekle')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
    )
}
