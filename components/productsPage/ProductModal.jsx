"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CustomerModal } from '@/components/mainPage/CustomerModal'
import { toast } from 'sonner'
import axios from 'axios'

const productCategories = [
    { value: 'Bilgisayar', label: '💻 Bilgisayar', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { value: 'Yazarkasa', label: '🧾 Yazarkasa', color: 'bg-green-50 border-green-200 text-green-800' },
    { value: 'Termal Printer', label: '🖨️ Termal Printer', color: 'bg-purple-50 border-purple-200 text-purple-800' },
    { value: 'Tartı', label: '⚖️ Tartı', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    { value: 'Mini Ekran', label: '📟 Mini Ekran', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { value: 'POS Terminal', label: '💳 POS Terminal', color: 'bg-red-50 border-red-200 text-red-800' },
    { value: 'Scanner', label: '📷 Scanner', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { value: 'Tablet', label: '📱 Tablet', color: 'bg-pink-50 border-pink-200 text-pink-800' },
    { value: 'Kasa Çekmecesi', label: '💰 Kasa Çekmecesi', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { value: 'Diğer', label: '📦 Diğer', color: 'bg-gray-50 border-gray-200 text-gray-800' }
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
    selectedProduct, 
    customers, 
    onRefreshCustomers 
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
        location: '',
        customerID: ''
    })

    const [customerModalVisible, setCustomerModalVisible] = useState(false)
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
                location: selectedProduct.location || '',
                customerID: selectedProduct.customerID || ''
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
                location: '',
                customerID: ''
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

    const handleCustomerSubmit = async (customerData) => {
        try {
            const response = await axios.post('/api/customers', customerData)
            await onRefreshCustomers()
            setCustomerModalVisible(false)
            // Auto-select the newly created customer
            setFormData(prev => ({ ...prev, customerID: response.data.id }))
            toast.success('Müşteri başarıyla eklendi ve seçildi')
        } catch (error) {
            console.error('Error creating customer:', error)
            toast.error('Müşteri eklenirken hata oluştu')
        }
    }

    if (!visible) return null

    return (
        <>
            <Dialog open={visible} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProduct ? 'Fiziksel Ürünü Düzenle' : 'Yeni Fiziksel Ürün Ekle'}
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
                                    <Label htmlFor="purchasePrice">Alış Fiyatı (₺)</Label>
                                    <Input
                                        id="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                        placeholder="0.00"
                                    />
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
                                <Label htmlFor="customer">Müşteri</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.customerID || "none"} onValueChange={(value) => handleInputChange('customerID', value === "none" ? "" : value)}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Müşteri seçin (opsiyonel)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Müşteri seçilmedi</SelectItem>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCustomerModalVisible(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

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

            <CustomerModal
                visible={customerModalVisible}
                onClose={() => setCustomerModalVisible(false)}
                onSubmit={handleCustomerSubmit}
                selectedCustomer={null}
            />
        </>
    )
}
