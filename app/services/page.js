"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceTable } from '@/components/servicesPage/ServicesTable'
import { ServiceModal2 } from '@/components/servicesPage/ServiceModal2'
import { DeleteConfirmModal } from '@/components/mainPage/DeleteConfirmModal'
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { RenewHistoryModal } from '@/components/RenewHistoryModal'
import { toast } from 'sonner'


export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [serviceModalVisible, setServiceModalVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState(null)
  const [customers, setCustomers] = useState([])

  const [renewHistoryOpen, setRenewHistoryOpen] = useState(false)
  const [selectedServiceForHistory, setSelectedServiceForHistory] = useState(null)
  const [renewHistory, setRenewHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [permissions, setPermissions] = useState(null);

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetchServices()
    fetchCustomers()
    fetchAdminData();

    // Global keyboard shortcuts
    const handleKeyDown = (event) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.querySelector('input[placeholder*="Hizmet adı"]')?.focus();
      }
      // Ctrl+Enter or Cmd+Enter to search
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [])

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/auth/me");

      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    }
  };

  const fetchServices = async (page = 1, search = '', sortField = sortBy, order = sortOrder) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        sortBy: sortField,
        sortOrder: order
      });
      
      const response = await axios.get(`/api/services?${params}`)
      
      // Update services and pagination
      setServices(response.data.services || [])
      setPagination(response.data.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0
      })
    } catch (error) {
      if (error.response.status === 403)
        toast.error('Yasak: Hizmet görüntüleme izniniz yok')
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      // Handle the new pagination response structure
      setCustomers(response.data.customers || response.data || [])
    } catch (error) {
      if (error.response?.status === 403)
        toast.error('Yasak: Müşterileri görüntüleme izniniz yok')
      else
        console.log('Error fetching customers:', error)
    }
  }

  const fetchRenewHistory = async (serviceId) => {
    try {
      setLoadingHistory(true)
      const response = await axios.get(`/api/renew-histories/${serviceId}`)
      setRenewHistory(response.data)
    } catch (error) {
      if (error.response.status === 403)
        toast.error('Yasak: Yenileme geçmişini görüntüleme izniniz yok')
      else
        console.log('Error fetching renew history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDelete = async () => {
    if (selectedService) {
      try {
        await axios.delete(`/api/services/${selectedService.id}`)
        fetchServices(pagination.page, searchTerm, sortBy, sortOrder)
        setDeleteConfirmVisible(false)
      } catch (error) {
        console.log('Error deleting service:', error)
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      if (selectedService) {
        await axios.put(`/api/services/${selectedService.id}`, formData)
      } else {
        await axios.post('/api/services', formData)
      }
      await fetchServices(pagination.page, searchTerm, sortBy, sortOrder) // Ensure fetch completes before closing modal
      setServiceModalVisible(false)
      setSelectedService(null)
    } catch (error) {
      console.log('Error submitting service:', error)
      alert('Failed to save service. Please try again.') // User feedback
    }
  }

  // Pagination handlers
  const handleSearch = () => {
    fetchServices(1, searchTerm, sortBy, sortOrder);
  };

  const handlePageChange = (newPage) => {
    fetchServices(newPage, searchTerm, sortBy, sortOrder);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize }));
    fetchServices(1, searchTerm, sortBy, sortOrder);
  };

  return (
    <div className="w-full min-h-full pt-6">
      <div className="flex flex-col gap-4 mb-4 px-4">
        <div className="flex gap-2">
          {permissions?.canEditServices && (
            <Button onClick={() => {
              setSelectedService(null)
              setServiceModalVisible(true)
            }}>
              <Plus className="mr-2 h-4 w-4" /> Hizmet Ekle
            </Button>
          )}
        </div>

        {/* Search and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hizmet Arama ve Filtreleme</span>
              <div className="text-xs text-muted-foreground">
                Ctrl+F: Arama | Enter: Ara | Esc: Temizle
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Hizmet adı, açıklama, şirket adı veya kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  } else if (e.key === 'Escape') {
                    setSearchTerm('');
                    fetchServices(1, '', sortBy, sortOrder);
                  }
                }}
                className="max-w-sm"
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Ara
              </Button>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    fetchServices(1, '', sortBy, sortOrder);
                  }}
                >
                  Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <ServiceTable
          services={services}
          customers={customers}
          isLoading={loading}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          onEdit={(service) => {
            setSelectedService(service)
            setServiceModalVisible(true)
          }}
          onDelete={(service) => {
            setSelectedService(service)
            setDeleteConfirmVisible(true)
          }}
          onViewHistory={(service) => {
            setSelectedServiceForHistory(service)
            fetchRenewHistory(service.id)
            setRenewHistoryOpen(true)
          }}
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Toplam {pagination.total} kayıt, sayfa {pagination.page} / {pagination.totalPages}
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
              
              {/* Page numbers */}
              {(() => {
                const showPages = [];
                const current = pagination.page;
                const total = pagination.totalPages;
                
                // Always show first page
                if (current > 3) {
                  showPages.push(1);
                  if (current > 4) showPages.push('...');
                }
                
                // Show pages around current
                for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
                  showPages.push(i);
                }
                
                // Always show last page
                if (current < total - 2) {
                  if (current < total - 3) showPages.push('...');
                  showPages.push(total);
                }
                
                return showPages.map((page, index) => {
                  if (page === '...') {
                    return <span key={index} className="px-2 text-muted-foreground">...</span>;
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === current ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                });
              })()}
              
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

      <ServiceModal2
        visible={serviceModalVisible}
        onClose={() => {
          setServiceModalVisible(false)
          setSelectedService(null)
        }}
        onSubmit={handleSubmit}
        selectedService={selectedService}
        customers={customers}
      />

      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleDelete}
        itemName={selectedService?.name}
        itemType="service"
      />

      <RenewHistoryModal
        visible={renewHistoryOpen}
        onClose={() => {
          setRenewHistoryOpen(false)
          setSelectedServiceForHistory(null)
        }}
        renewHistory={renewHistory}
        loadingOnModal={loadingHistory}
        selectedService={selectedServiceForHistory}
        onDeleteRenewal={async (renewal) => {
          try {
            await axios.delete(`/api/renew-histories/${renewal.id}`)
            fetchRenewHistory(selectedServiceForHistory.id)
          } catch (error) {
            console.log('Error deleting renewal:', error)
          }
        }}
      />
    </div>
  )
}