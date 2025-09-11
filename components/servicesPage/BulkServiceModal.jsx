"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Predefined service categories with their default configurations
const SERVICE_CATEGORIES = {
  'Adisyon Programı': {
    name: 'Adisyon Programı',
    defaultPrice: 6990,
    unlimitedPrice: 40000,
    description: 'Otomatik API ile oluşturulur (deviceToken gerekli)',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    locked: true
  },
  'Digital Menü': {
    name: 'Digital Menü',
    defaultPrice: 990,
    description: 'Digital menü sistemi',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    noUnlimited: true
  },
  'Kurye Sipariş Uygulaması': {
    name: 'Kurye Sipariş Uygulaması',
    defaultPrice: 990,
    description: 'Kurye sipariş takip uygulaması',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    noUnlimited: true
  },
  'Patron Takip Uygulaması': {
    name: 'Patron Takip Uygulaması',
    defaultPrice: 990,
    description: 'Patron yönetim uygulaması',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    noUnlimited: true
  },
  'Garson Sipariş Uygulaması': {
    name: 'Garson Sipariş Uygulaması',
    defaultPrice: 490,
    unlimitedPrice: 5000,
    description: 'Garson sipariş uygulaması',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  },
  'Android Caller ID Uygulaması': {
    name: 'Android Caller ID Uygulaması',
    defaultPrice: 490,
    unlimitedPrice: 1500,
    description: 'Android Caller ID uygulaması',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
  },
  'Yazarkasa Pos Entegrasyonu': {
    name: 'Yazarkasa Pos Entegrasyonu',
    defaultPrice: 490,
    description: 'Yazarkasa Pos entegrasyonu',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    noUnlimited: true
  },
  'Yemek Sepeti': {
    name: 'Yemek Sepeti',
    defaultPrice: 490,
    description: 'Yemek Sepeti entegrasyonu',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    noUnlimited: true
  },
  'Migros Yemek': {
    name: 'Migros Yemek',
    defaultPrice: 490,
    description: 'Migros Yemek entegrasyonu',
    color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
    noUnlimited: true
  },
  'Trendyol Yemek': {
    name: 'Trendyol Yemek',
    defaultPrice: 490,
    description: 'Trendyol Yemek entegrasyonu',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    noUnlimited: true
  },
  'Getir Yemek': {
    name: 'Getir Yemek',
    defaultPrice: 490,
    description: 'Getir Yemek entegrasyonu',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    noUnlimited: true
  }
}

// Quick select groups - Excluding locked Adisyon Programı
const QUICK_SELECT_GROUPS = {
  'delivery-apps': {
    name: 'Yemek Uygulamaları',
    categories: ['Yemek Sepeti', 'Trendyol Yemek', 'Migros Yemek', 'Getir Yemek'],
    color: 'bg-red-500'
  },
  'full-package': {
    name: 'Tam Paket',
    categories: ['Digital Menü', 'Kurye Sipariş Uygulaması', 'Patron Takip Uygulaması', 'Garson Sipariş Uygulaması'],
    color: 'bg-green-500'
  },
  'complete-solution': {
    name: 'Komple Çözüm (Program Hariç)',
    categories: ['Digital Menü', 'Kurye Sipariş Uygulaması', 'Patron Takip Uygulaması', 'Garson Sipariş Uygulaması', 'Android Caller ID Uygulaması', 'Yazarkasa Pos Entegrasyonu', 'Yemek Sepeti', 'Trendyol Yemek', 'Migros Yemek', 'Getir Yemek'],
    color: 'bg-purple-500'
  }
}

export function BulkServiceModal({ visible, onClose, onSubmit, customers = [], selectedCustomer = null }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [currency, setCurrency] = useState('TL')
  const [startingDate, setStartingDate] = useState(new Date())
  const [companyName, setCompanyName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [servicePaymentTypes, setServicePaymentTypes] = useState({})
  const [serviceCounts, setServiceCounts] = useState({})

  // Set selected customer when prop changes
  useEffect(() => {
    if (selectedCustomer && visible) {
      setSelectedCustomerId(String(selectedCustomer.id))
      setCompanyName(selectedCustomer.name || '')
    }
  }, [selectedCustomer, visible])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      // Only reset if no selectedCustomer prop is provided
      if (!selectedCustomer) {
        setSelectedCustomerId('')
        setCompanyName('')
      }
      setSelectedCategories([])
      setCurrency('TL')
      setStartingDate(new Date())
      setIsSubmitting(false)
      setServicePaymentTypes({})
      setServiceCounts({})
    }
  }, [visible, selectedCustomer])

  const handleQuickSelect = (groupKey) => {
    const group = QUICK_SELECT_GROUPS[groupKey]
    // Filter out locked categories from quick selection
    const availableCategories = group.categories.filter(cat => !SERVICE_CATEGORIES[cat].locked)
    
    // Set categories and initialize their payment types
    const newServicePaymentTypes = {}
    const newServiceCounts = {}
    availableCategories.forEach(categoryKey => {
      newServicePaymentTypes[categoryKey] = '1year' // Default to yearly
      newServiceCounts[categoryKey] = 1 // Default to 1 service
    })
    
    setServicePaymentTypes(newServicePaymentTypes)
    setServiceCounts(newServiceCounts)
    setSelectedCategories(availableCategories)
  }

  const handleCategoryToggle = (categoryKey) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryKey)) {
        // Remove category and its payment type
        const newServicePaymentTypes = { ...servicePaymentTypes }
        const newServiceCounts = { ...serviceCounts }
        delete newServicePaymentTypes[categoryKey]
        delete newServiceCounts[categoryKey]
        setServicePaymentTypes(newServicePaymentTypes)
        setServiceCounts(newServiceCounts)
        return prev.filter(cat => cat !== categoryKey)
      } else {
        // Add category with default payment type and count
        setServicePaymentTypes(prev => ({
          ...prev,
          [categoryKey]: '1year' // Default to yearly
        }))
        setServiceCounts(prev => ({
          ...prev,
          [categoryKey]: 1 // Default to 1 service
        }))
        return [...prev, categoryKey]
      }
    })
  }

  const calculateTotalPrice = () => {
    return selectedCategories.reduce((total, categoryKey) => {
      const category = SERVICE_CATEGORIES[categoryKey]
      const paymentType = servicePaymentTypes[categoryKey] || '1year'
      const count = serviceCounts[categoryKey] || 1
      
      let price = category.defaultPrice
      // Use unlimited price if payment type is unlimited and category supports it
      if (paymentType === 'unlimited' && category.unlimitedPrice && !category.noUnlimited) {
        price = category.unlimitedPrice
      }
      
      return total + (price * count)
    }, 0)
  }

  const calculateTotalServiceCount = () => {
    return selectedCategories.reduce((total, categoryKey) => {
      const count = serviceCounts[categoryKey] || 1
      return total + count
    }, 0)
  }

  const handlePaymentTypeChange = (categoryKey, newPaymentType) => {
    setServicePaymentTypes(prev => ({
      ...prev,
      [categoryKey]: newPaymentType
    }))
  }

  const handleCountChange = (categoryKey, newCount) => {
    const count = Math.max(1, parseInt(newCount) || 1) // Ensure minimum 1
    setServiceCounts(prev => ({
      ...prev,
      [categoryKey]: count
    }))
  }

  const getEndDateForService = (paymentType, startDate) => {
    const start = new Date(startDate)
    let end = new Date(start)

    switch (paymentType) {
      case '1month':
        end.setMonth(end.getMonth() + 1)
        break
      case '6months':
        end.setMonth(end.getMonth() + 6)
        break
      case '1year':
        end.setFullYear(end.getFullYear() + 1)
        break
      case '2years':
        end.setFullYear(end.getFullYear() + 2)
        break
      case '3years':
        end.setFullYear(end.getFullYear() + 3)
        break
      case 'unlimited':
        end.setFullYear(end.getFullYear() + 100) // Far future for unlimited
        break
      default:
        end.setFullYear(end.getFullYear() + 1)
    }

    return end
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      toast.error('Lütfen bir müşteri seçin')
      return
    }

    if (selectedCategories.length === 0) {
      toast.error('Lütfen en az bir hizmet kategorisi seçin')
      return
    }

    setIsSubmitting(true)

    try {
      const customer = customers.find(c => c.id === selectedCustomerId)
      const customerCompanyName = companyName || customer?.name || 'Belirtilmemiş'

      console.log('Debug - selectedCustomerId:', selectedCustomerId)
      console.log('Debug - found customer:', customer)
      console.log('Debug - all customers:', customers.map(c => ({ id: c.id, name: c.name })))

      // Create services for each selected category with their counts
      const servicePromises = []
      
      selectedCategories.forEach(categoryKey => {
        const category = SERVICE_CATEGORIES[categoryKey]
        const paymentType = servicePaymentTypes[categoryKey] || '1year'
        const count = serviceCounts[categoryKey] || 1
        
        let price = category.defaultPrice
        // Use unlimited price if payment type is unlimited and category supports it
        if (paymentType === 'unlimited' && category.unlimitedPrice && !category.noUnlimited) {
          price = category.unlimitedPrice
        }

        const endDate = getEndDateForService(paymentType, startingDate)
        
        // Create multiple services based on count
        for (let i = 0; i < count; i++) {
          servicePromises.push({
            name: count > 1 ? `${category.name} ${i + 1}` : category.name, // Add number if multiple
            description: category.description,
            companyName: customerCompanyName,
            category: categoryKey,
            paymentType,
            periodPrice: price,
            currency,
            customerID: selectedCustomerId, // Keep as string, don't parse to int
            startingDate: startingDate.toISOString(),
            endingDate: endDate.toISOString(),
            active: true
          })
        }
      })

      console.log('Debug - services to create:', servicePromises)

      // Submit all services
      await onSubmit(servicePromises)
      
      toast.success(`${servicePromises.length} hizmet başarıyla oluşturuldu`)
      onClose()
    } catch (error) {
      console.error('Bulk service creation error:', error)
      
      // Extract more specific error message from response
      let errorMessage = 'Hizmetler oluşturulurken hata oluştu'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debug log to check customers data
  console.log('Customers data:', customers)
  console.log('Selected customer ID:', selectedCustomerId)
  console.log('Selected customer prop:', selectedCustomer)

  if (!visible) return null

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Toplu Hizmet Tanımla
            {selectedCategories.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({calculateTotalServiceCount()} hizmet oluşturulacak)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Müşteri * ({customers.length} müşteri mevcut)</Label>
            {customers.length === 0 ? (
              <div className="p-3 border rounded-md bg-yellow-50 text-yellow-700">
                Müşteri bulunamadı. Önce müşteri eklemeniz gerekiyor.
              </div>
            ) : (
              <Select 
                value={selectedCustomerId} 
                onValueChange={(value) => {
                  console.log('Customer selected:', value)
                  setSelectedCustomerId(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {customers.map((customer) => (
                    <SelectItem 
                      key={customer.id} 
                      value={String(customer.id)}
                    >
                      {customer.name || `Müşteri ${customer.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">İşletme Adı</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="İşletme adını girin (opsiyonel)"
            />
          </div>

          {/* Quick Select Buttons */}
          <div className="space-y-2">
            <Label>Hızlı Seçim</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(QUICK_SELECT_GROUPS).map(([key, group]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(key)}
                  className={cn(
                    "text-white border-0",
                    group.color
                  )}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Service Categories Selection */}
          <div className="space-y-2">
            <Label>Hizmet Kategorileri *</Label>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Not:</strong> Adisyon Programı otomatik olarak API aracılığıyla oluşturulur ve deviceToken gerektirir. 
                Bu kategori kilitlidir ve hızlı seçim butonları ile seçilemez.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => {
                const isLocked = category.locked
                const isSelected = selectedCategories.includes(key)
                const paymentType = servicePaymentTypes[key] || '1year'
                let displayPrice = category.defaultPrice
                
                // Calculate display price based on individual payment type
                if (paymentType === 'unlimited' && category.unlimitedPrice && !category.noUnlimited) {
                  displayPrice = category.unlimitedPrice
                }
                
                return (
                  <Card 
                    key={key} 
                    className={cn(
                      "transition-all border-2",
                      isLocked 
                        ? "opacity-50 cursor-not-allowed border-gray-300" 
                        : "cursor-pointer",
                      !isLocked && isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => !isLocked && handleCategoryToggle(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={isSelected}
                            disabled={isLocked}
                            readOnly
                          />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {category.name}
                              {isLocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Kilitli
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {category.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {isLocked ? (
                              <div className="text-center">
                                <div>₺{category.defaultPrice}</div>
                                <div className="text-xs text-muted-foreground">Yıllık Kiralık</div>
                                <div className="mt-1">₺{category.unlimitedPrice}</div>
                                <div className="text-xs text-muted-foreground">Süresiz Lisans</div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div>₺{displayPrice}</div>
                                <div className="text-xs text-muted-foreground">
                                  {paymentType === 'unlimited' ? 'Süresiz Lisans' : 'Yıllık'}
                                </div>
                              </div>
                            )}
                          </div>
                          <Badge className={category.color}>
                            {category.name.split(' ')[0]}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Selected Services Summary */}
          {selectedCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seçilen Hizmetler ve Ödeme Tipleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {selectedCategories.map(categoryKey => {
                      const category = SERVICE_CATEGORIES[categoryKey]
                      const paymentType = servicePaymentTypes[categoryKey] || '1year'
                      const count = serviceCounts[categoryKey] || 1
                      
                      let currentPrice = category.defaultPrice
                      if (paymentType === 'unlimited' && category.unlimitedPrice && !category.noUnlimited) {
                        currentPrice = category.unlimitedPrice
                      }
                      
                      return (
                        <div key={categoryKey} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={category.color}>
                              {category.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {category.description}
                            </span>
                            <div className="text-sm font-medium">
                              ₺{currentPrice} × {count} = ₺{(currentPrice * count).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`count-${categoryKey}`} className="text-xs">Adet:</Label>
                              <Input
                                id={`count-${categoryKey}`}
                                type="number"
                                min="1"
                                max="99"
                                value={count}
                                onChange={(e) => handleCountChange(categoryKey, e.target.value)}
                                className="w-16 h-8 text-sm text-center"
                              />
                            </div>
                            <Select
                              value={paymentType}
                              onValueChange={(value) => handlePaymentTypeChange(categoryKey, value)}
                            >
                              <SelectTrigger className="w-36 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1month">1 Ay</SelectItem>
                                <SelectItem value="6months">6 Ay</SelectItem>
                                <SelectItem value="1year">1 Yıl</SelectItem>
                                <SelectItem value="2years">2 Yıl</SelectItem>
                                <SelectItem value="3years">3 Yıl</SelectItem>
                                {!category.noUnlimited && (
                                  <SelectItem value="unlimited">Sınırsız</SelectItem>
                                )}
                                <SelectItem value="custom">Özel</SelectItem>
                              </SelectContent>
                            </Select>
                            {!category.locked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCategoryToggle(categoryKey)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xl font-bold text-primary flex items-center justify-between">
                      <span>Toplam Fiyat:</span>
                      <span>₺{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {calculateTotalServiceCount()} hizmet oluşturulacak - Fiyatlar seçilen ödeme tiplerine ve adetlere göre hesaplanmıştır
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shared Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ortak Ayarlar (Tüm Hizmetler İçin)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TL">₺ (TL)</SelectItem>
                      <SelectItem value="USD">$ (USD)</SelectItem>
                      <SelectItem value="EUR">€ (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startingDate ? format(startingDate, "dd MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startingDate}
                        onSelect={setStartingDate}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                  {startingDate && (
                    <div className="text-sm text-muted-foreground">
                      Seçilen tarih: {format(startingDate, "dd/MM/yyyy", { locale: tr })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 border rounded-lg dark:bg-gray-950/20 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Not:</strong> Bitiş tarihleri her hizmetin kendi ödeme tipine göre otomatik olarak hesaplanacaktır.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="button" 
              disabled={isSubmitting || customers.length === 0 || selectedCategories.length === 0}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 
                selectedCategories.length > 0 
                  ? `${calculateTotalServiceCount()} Hizmet Oluştur (₺${calculateTotalPrice().toFixed(2)})` 
                  : 'Hizmet Seç'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}