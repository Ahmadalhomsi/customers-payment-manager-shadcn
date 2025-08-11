"use client"

import { useState, useEffect, useCallback } from 'react'
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
  // Add additional filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState();
  const [endDateRangeFilter, setEndDateRangeFilter] = useState();

  useEffect(() => {
    fetchServices()
    fetchCustomers()
    fetchAdminData();

    // Global keyboard shortcuts
    const handleKeyDown = (event) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.querySelector('input[placeholder*="Hizmetleri ara"]')?.focus();
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

  // Trigger filtering when filter values change
  useEffect(() => {
    if (statusFilter !== 'all' || categoryFilter !== 'all' || dateRangeFilter?.from || endDateRangeFilter?.from) {
      handleFilterChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, dateRangeFilter, endDateRangeFilter]);

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

  const fetchServices = async (page = 1, search = '', sortField = sortBy, order = sortOrder, limit = pageSize) => {
    try {
      setLoading(true)
      
      // Validate page parameter
      const validPage = Math.max(1, parseInt(page) || 1);
      
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: limit.toString(),
        search,
        sortBy: sortField,
        sortOrder: order
      });
      
      const response = await axios.get(`/api/services?${params}`)
      
      // Update services and pagination
      setServices(response.data.services || [])
      const newPagination = response.data.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0
      }
      
      // Check if current page exceeds total pages and redirect to last page
      if (newPagination.totalPages > 0 && validPage > newPagination.totalPages) {
        // Recursively fetch the last valid page
        return fetchServices(newPagination.totalPages, search, sortField, order, limit);
      }
      
      setPagination(newPagination)
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

  // Enhanced search handlers
  const handleSearch = () => {
    fetchServices(1, searchTerm, sortBy, sortOrder);
  };

  const handleFilterChange = () => {
    // When advanced filters are applied, we need to fetch all data to ensure proper filtering
    if (statusFilter !== 'all' || categoryFilter !== 'all' || dateRangeFilter?.from || endDateRangeFilter?.from) {
      // Fetch all data without pagination when filters are active
      fetchServices(1, searchTerm, sortBy, sortOrder, 10000); // Use a large limit to get all data
    } else {
      // Use normal pagination when no advanced filters are applied
      fetchServices(1, searchTerm, sortBy, sortOrder, pageSize);
    }
  };

  // Helper function to apply client-side filtering on fetched data
  const getFilteredServices = () => {
    if (statusFilter === 'all' && categoryFilter === 'all' && !dateRangeFilter?.from && !endDateRangeFilter?.from) {
      return services; // No filtering needed
    }

    return services.filter(service => {
      // Status filtering
      if (statusFilter !== 'all') {
        const status = getServiceStatus(service);
        if (status !== statusFilter) return false;
      }

      // Category filtering
      if (categoryFilter !== 'all') {
        const serviceCategory = service.category || 'Adisyon Programı';
        if (serviceCategory !== categoryFilter) return false;
      }

      // Start date filtering
      if (dateRangeFilter?.from || dateRangeFilter?.to) {
        const serviceStart = new Date(service.startingDate);
        
        if (dateRangeFilter?.from && dateRangeFilter?.to) {
          if (serviceStart < dateRangeFilter.from || serviceStart > dateRangeFilter.to) return false;
        } else if (dateRangeFilter?.from) {
          if (serviceStart < dateRangeFilter.from) return false;
        } else if (dateRangeFilter?.to) {
          if (serviceStart > dateRangeFilter.to) return false;
        }
      }

      // End date filtering
      if (endDateRangeFilter?.from || endDateRangeFilter?.to) {
        const serviceEnd = new Date(service.endingDate);
        
        if (endDateRangeFilter?.from && endDateRangeFilter?.to) {
          if (serviceEnd < endDateRangeFilter.from || serviceEnd > endDateRangeFilter.to) return false;
        } else if (endDateRangeFilter?.from) {
          if (serviceEnd < endDateRangeFilter.from) return false;
        } else if (endDateRangeFilter?.to) {
          if (serviceEnd > endDateRangeFilter.to) return false;
        }
      }

      return true;
    });
  };

  // Helper function to get service status
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
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateRangeFilter(undefined);
    setEndDateRangeFilter(undefined);
    // Reset to normal pagination
    fetchServices(1, searchTerm, sortBy, sortOrder, pageSize);
  };

  // Sorting handler
  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    fetchServices(pagination.page, searchTerm, field, newOrder);
  };

  const handlePageChange = (newPage) => {
    // Validate page number
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchServices(newPage, searchTerm, sortBy, sortOrder);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize }));
    fetchServices(1, searchTerm, sortBy, sortOrder, newPageSize);
  };

  // Memoized pagination component to prevent re-renders
  const renderPaginationNumbers = () => {
    const showPages = [];
    const current = pagination.page;
    const total = pagination.totalPages;
    
    if (total <= 7) {
      // If 7 or fewer pages, show all
      for (let i = 1; i <= total; i++) {
        showPages.push(i);
      }
    } else {
      // Complex pagination logic for more than 7 pages
      const delta = 2; // Number of pages to show around current page
      
      // Always add first page
      showPages.push(1);
      
      // Calculate the range around current page
      const rangeStart = Math.max(2, current - delta);
      const rangeEnd = Math.min(total - 1, current + delta);
      
      // Add ellipsis after first page if needed
      if (rangeStart > 2) {
        showPages.push('...');
      }
      
      // Add pages in the middle range
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i !== 1 && i !== total) { // Don't duplicate first or last page
          showPages.push(i);
        }
      }
      
      // Add ellipsis before last page if needed
      if (rangeEnd < total - 1) {
        showPages.push('...');
      }
      
      // Always add last page if it's different from first page
      if (total > 1) {
        showPages.push(total);
      }
    }
    
    return showPages.map((page, index) => {
      if (page === '...') {
        return <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>;
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
      );
    });
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
      </div>

      <div className="px-4">
        <ServiceTable
          services={getFilteredServices()}
          customers={customers}
          isLoading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          dateRangeFilter={dateRangeFilter}
          onDateRangeChange={setDateRangeFilter}
          endDateRangeFilter={endDateRangeFilter}
          onEndDateRangeChange={setEndDateRangeFilter}
          onClearFilters={handleClearFilters}
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

        {/* Pagination Controls - Fixed with working algorithm from logs page */}
        {pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {statusFilter !== 'all' || categoryFilter !== 'all' || dateRangeFilter?.from || endDateRangeFilter?.from ? (
                  `${getFilteredServices().length} / ${services.length} kayıt gösteriliyor (${pagination.total} toplam)`
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
              
              {/* Fixed Page numbers - using memoized function */}
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

      <ServiceModal2
        visible={serviceModalVisible}
        onClose={() => {
          setServiceModalVisible(false)
          setSelectedService(null)
        }}
        onSubmit={handleSubmit}
        selectedService={selectedService}
        customers={customers}
        onRefreshCustomers={fetchCustomers}
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