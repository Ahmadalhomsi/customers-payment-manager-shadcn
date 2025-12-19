"use client"

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductsTable } from '@/components/productsPage/ProductsTable'
import { ProductModal } from '@/components/productsPage/ProductModal'
import { DeleteConfirmModal } from '@/components/mainPage/DeleteConfirmModal'
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState(null)

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [pageSize, setPageSize] = useState(20)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')

  useEffect(() => {
    // Global keyboard shortcuts setup
    const handleKeyDown = (event) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        document.querySelector('input[placeholder*="Ürün ara"]')?.focus()
      }
      // Ctrl+Enter or Cmd+Enter to search
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        document.querySelector('input[placeholder*="Ürün ara"] + button')?.click()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Trigger filtering when filter values change
  useEffect(() => {
    handleFilterChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, brandFilter])

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/auth/me")

      if (res.ok) {
        const data = await res.json()
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    }
  }

  const fetchProducts = useCallback(async (page = 1, search = '', sortField = sortBy, order = sortOrder, limit = pageSize) => {
    try {
      setLoading(true)
      
      // Validate page parameter
      const validPage = Math.max(1, parseInt(page) || 1)
      
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: limit.toString(),
        search,
        sortBy: sortField,
        sortOrder: order
      })

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      // Add category filter if not 'all'
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      // Add brand filter if not 'all'
      if (brandFilter !== 'all') {
        params.append('brand', brandFilter)
      }
      
      const response = await axios.get(`/api/products?${params}`)
      
      // Update products and pagination
      setProducts(response.data.products || [])
      const newPagination = response.data.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0
      }
      
      // Check if current page exceeds total pages and redirect to last page
      if (newPagination.totalPages > 0 && validPage > newPagination.totalPages) {
        // Recursively fetch the last valid page
        return fetchProducts(newPagination.totalPages, search, sortField, order, limit)
      }
      
      setPagination(newPagination)
    } catch (error) {
      if (error.response?.status === 403)
        toast.error('Yasak: Fiziksel ürün görüntüleme izniniz yok')
      else
        console.error('Error fetching products:', error)
    }
    setLoading(false)
  }, [sortBy, sortOrder, pageSize, statusFilter, categoryFilter, brandFilter])

  // Enhanced search handlers
  const handleSearch = useCallback(() => {
    fetchProducts(1, searchTerm, sortBy, sortOrder, pageSize)
  }, [fetchProducts, searchTerm, sortBy, sortOrder, pageSize])

  // Initial data loading
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true)
        
        const params = new URLSearchParams({
          page: '1',
          limit: '20',
          search: '',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        
        const response = await axios.get(`/api/products?${params}`)
        setProducts(response.data.products || [])
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        })
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading initial products:', error)
        setLoading(false)
      }
    }
    
    initialLoad()
    fetchAdminData()
  }, [])

  // Setup keyboard shortcuts after functions are defined
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        document.querySelector('input[placeholder*="Ürün ara"]')?.focus()
      }
      // Ctrl+Enter or Cmd+Enter to search
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSearch])

  const handleDelete = async () => {
    if (selectedProduct) {
      try {
        await axios.delete(`/api/products/${selectedProduct.id}`)
        fetchProducts(pagination.page, searchTerm, sortBy, sortOrder)
        setDeleteConfirmVisible(false)
        toast.success('Ürün başarıyla silindi')
      } catch (error) {
        console.log('Error deleting product:', error)
        toast.error('Ürün silinirken hata oluştu')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      if (selectedProduct) {
        await axios.put(`/api/products/${selectedProduct.id}`, formData)
        toast.success('Ürün başarıyla güncellendi')
      } else {
        await axios.post('/api/products', formData)
        toast.success('Ürün başarıyla eklendi')
      }
      await fetchProducts(pagination.page, searchTerm, sortBy, sortOrder)
      setProductModalVisible(false)
      setSelectedProduct(null)
    } catch (error) {
      console.log('Error submitting product:', error)
      toast.error('Ürün kaydedilirken hata oluştu')
    }
  }

  const handleFilterChange = () => {
    fetchProducts(1, searchTerm, sortBy, sortOrder, pageSize)
  }

  const handleClearFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setBrandFilter('all')
    fetchProducts(1, searchTerm, sortBy, sortOrder, pageSize)
  }

  // Sorting handler
  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newOrder)
    fetchProducts(pagination.page, searchTerm, field, newOrder)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    fetchProducts(newPage, searchTerm, sortBy, sortOrder)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize }))
    fetchProducts(1, searchTerm, sortBy, sortOrder, newPageSize)
  }

  // Pagination component
  const renderPaginationNumbers = () => {
    const showPages = []
    const current = pagination.page
    const total = pagination.totalPages
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        showPages.push(i)
      }
    } else {
      const delta = 2
      
      showPages.push(1)
      
      const rangeStart = Math.max(2, current - delta)
      const rangeEnd = Math.min(total - 1, current + delta)
      
      if (rangeStart > 2) {
        showPages.push('...')
      }
      
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i !== 1 && i !== total) {
          showPages.push(i)
        }
      }
      
      if (rangeEnd < total - 1) {
        showPages.push('...')
      }
      
      if (total > 1) {
        showPages.push(total)
      }
    }
    
    return showPages.map((page, index) => {
      if (page === '...') {
        return <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
      }
      return (
        <Button
          key={`page-${page}`}
          variant={page === current ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(page)}
          className="w-8 h-8 p-0"
        >
          {page}
        </Button>
      )
    })
  }

  return (
    <div className="w-full min-h-full pt-6 pb-6">
      <div className="flex flex-col gap-4 mb-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Envanter Yönetimi</h1>
            <p className="text-muted-foreground">Fiziksel ürünlerinizi yönetin ve takip edin</p>
          </div>
          {permissions?.canEditPhysicalProducts && (
            <Button onClick={() => {
              setSelectedProduct(null)
              setProductModalVisible(true)
            }}>
              <Plus className="mr-2 h-4 w-4" /> Ürün Ekle
            </Button>
          )}
        </div>
      </div>

      <div className="px-4">
        <ProductsTable
          products={products}
          isLoading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          brandFilter={brandFilter}
          onBrandChange={setBrandFilter}
          onClearFilters={handleClearFilters}
          onEdit={(product) => {
            setSelectedProduct(product)
            setProductModalVisible(true)
          }}
          onDelete={(product) => {
            setSelectedProduct(product)
            setDeleteConfirmVisible(true)
          }}
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {statusFilter !== 'all' || categoryFilter !== 'all' || brandFilter !== 'all' ? (
                  `${products.length} / ${pagination.total} kayıt gösteriliyor`
                ) : (
                  `Toplam ${pagination.total} kayıt, sayfa ${pagination.page} / ${pagination.totalPages}`
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sayfa başına:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {renderPaginationNumbers()}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        visible={productModalVisible}
        onClose={() => {
          setProductModalVisible(false)
          setSelectedProduct(null)
        }}
        onSubmit={handleSubmit}
        selectedProduct={selectedProduct}
      />

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleDelete}
        itemName={selectedProduct?.name}
        itemType="product"
      />
    </div>
  )
}
