'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Server, Trash2 } from 'lucide-react';
import { LogsTable } from '@/components/logPage';
import { ServiceModal2 } from '@/components/servicesPage/ServiceModal2';
import axios from 'axios';
import { toast } from 'sonner';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // Reduced from 50 for better performance
    total: 0,
    totalPages: 0
  });
  const [validationTypeFilter, setValidationTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt'); // New sorting state
  const [sortOrder, setSortOrder] = useState('desc'); // New sorting order state
  const [pageSize, setPageSize] = useState(20); // New page size state
  const [isClearing, setIsClearing] = useState(false); // State for clear operation

  // Service Modal states
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [isServiceLoading, setIsServiceLoading] = useState(false);

  // Column-specific filters
  const [columnFilters, setColumnFilters] = useState({
    ipAddress: '',
    serviceName: '',
    companyName: '',
    customerName: '',
    endpoint: '',
    terminal: '',
    serviceId: ''
  });

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();

    // Global keyboard shortcuts
    const handleKeyDown = (event) => {
      // Only add shortcuts if authenticated
      if (!authenticated) return;

      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.querySelector('input[placeholder*="IP Adresi"]')?.focus();
      }
      // Ctrl+Enter or Cmd+Enter to clear all filters
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        clearAllFilters();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const checkAuthentication = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        setAuthenticated(true);
        fetchLogs();
      } else {
        // Check if it's a token expiration error
        const errorData = await res.json();
        if (res.status === 401) {
          router.push('/login');
        } else {
          console.error("Authentication check failed:", errorData);
          router.push('/login');
        }
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.push('/login');
    }
  };

  const fetchLogs = async (page = 1, search = '', validationType = '', sortField = sortBy, order = sortOrder, limit = pageSize) => {
    setLoading(true);
    try {
      // Validate page parameter
      const validPage = Math.max(1, parseInt(page) || 1);

      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(validationType && validationType !== 'all' && { validationType }),
        ...(sortField && { sortBy: sortField }),
        ...(order && { sortOrder: order })
      });

      const response = await fetch(`/api/logs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        const newPagination = data.pagination;

        // Check if current page exceeds total pages and redirect to last page
        if (newPagination.totalPages > 0 && validPage > newPagination.totalPages) {
          // Recursively fetch the last valid page
          return fetchLogs(newPagination.totalPages, search, validationType, sortField, order, limit);
        }

        setPagination(newPagination);
      } else {
        console.error('Failed to fetch logs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch logs is now called from checkAuthentication after auth is verified
    fetchCustomers();
  }, []);

  // Trigger fetching when validation type filter changes (but not column filters - they need button/enter)
  useEffect(() => {
    if (authenticated && validationTypeFilter !== 'all') {
      // Use server-side validation type filtering
      fetchLogs(1, '', validationTypeFilter, sortBy, sortOrder, pageSize);
    } else if (authenticated && validationTypeFilter === 'all') {
      // Use normal pagination when no validation type filter
      fetchLogs(1, '', '', sortBy, sortOrder, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationTypeFilter, authenticated]);

  // Add search handler for column filters
  const handleColumnSearch = () => {
    // Build individual filter parameters for server-side search
    const params = new URLSearchParams({
      page: '1',
      limit: pageSize.toString(),
      ...(validationTypeFilter !== 'all' && { validationType: validationTypeFilter }),
      sortBy: sortBy,
      sortOrder: sortOrder
    });

    // Add individual field filters
    if (columnFilters.ipAddress?.trim()) {
      params.append('ipAddress', columnFilters.ipAddress.trim());
    }
    if (columnFilters.serviceName?.trim()) {
      params.append('serviceName', columnFilters.serviceName.trim());
    }
    if (columnFilters.companyName?.trim()) {
      params.append('companyName', columnFilters.companyName.trim());
    }
    if (columnFilters.customerName?.trim()) {
      params.append('customerName', columnFilters.customerName.trim());
    }
    if (columnFilters.endpoint?.trim()) {
      params.append('endpoint', columnFilters.endpoint.trim());
    }
    if (columnFilters.terminal?.trim()) {
      params.append('terminal', columnFilters.terminal.trim());
    }
    if (columnFilters.serviceId?.trim()) {
      params.append('serviceId', columnFilters.serviceId.trim());
    }

    // Fetch with individual parameters
    fetchLogsWithParams(params);
  };

  // Helper function to fetch logs with custom parameters
  const fetchLogsWithParams = async (params) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch logs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };



  const clearAllFilters = () => {
    setColumnFilters({
      ipAddress: '',
      serviceName: '',
      companyName: '',
      customerName: '',
      endpoint: '',
      terminal: '',
      serviceId: ''
    });
    setValidationTypeFilter('all');
    // Fetch with normal pagination when all filters are cleared
    fetchLogs(1, '', '', sortBy, sortOrder, pageSize);
  };

  const hasActiveFilters = () => {
    return Object.values(columnFilters).some(Boolean) ||
      validationTypeFilter !== 'all';
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);

    // Check if we have active column filters
    const hasColumnFilters = Object.values(columnFilters).some(Boolean);

    if (hasColumnFilters) {
      // Use column search with new sort order
      handleColumnSearch();
    } else {
      // Use normal pagination
      fetchLogs(pagination.page, '', validationTypeFilter !== 'all' ? validationTypeFilter : '', field, newOrder, pageSize);
    }
  };



  const handlePageChange = (newPage) => {
    // Validate page number
    if (newPage < 1 || newPage > pagination.totalPages) return;

    // Check if we have active column filters
    const hasColumnFilters = Object.values(columnFilters).some(Boolean);

    if (hasColumnFilters) {
      // Build parameters for column search with new page
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: pageSize.toString(),
        ...(validationTypeFilter !== 'all' && { validationType: validationTypeFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      // Add individual field filters
      if (columnFilters.ipAddress?.trim()) {
        params.append('ipAddress', columnFilters.ipAddress.trim());
      }
      if (columnFilters.serviceName?.trim()) {
        params.append('serviceName', columnFilters.serviceName.trim());
      }
      if (columnFilters.companyName?.trim()) {
        params.append('companyName', columnFilters.companyName.trim());
      }
      if (columnFilters.customerName?.trim()) {
        params.append('customerName', columnFilters.customerName.trim());
      }
      if (columnFilters.endpoint?.trim()) {
        params.append('endpoint', columnFilters.endpoint.trim());
      }
      if (columnFilters.terminal?.trim()) {
        params.append('terminal', columnFilters.terminal.trim());
      }
      if (columnFilters.serviceId?.trim()) {
        params.append('serviceId', columnFilters.serviceId.trim());
      }

      fetchLogsWithParams(params);
    } else {
      // Use normal pagination
      fetchLogs(newPage, '', validationTypeFilter !== 'all' ? validationTypeFilter : '', sortBy, sortOrder, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize })); // Reset to first page and update limit

    // Check if we have active column filters
    const hasColumnFilters = Object.values(columnFilters).some(Boolean);

    if (hasColumnFilters) {
      // Build parameters for column search with new page size
      const params = new URLSearchParams({
        page: '1',
        limit: newPageSize.toString(),
        ...(validationTypeFilter !== 'all' && { validationType: validationTypeFilter }),
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      // Add individual field filters
      if (columnFilters.ipAddress?.trim()) {
        params.append('ipAddress', columnFilters.ipAddress.trim());
      }
      if (columnFilters.serviceName?.trim()) {
        params.append('serviceName', columnFilters.serviceName.trim());
      }
      if (columnFilters.companyName?.trim()) {
        params.append('companyName', columnFilters.companyName.trim());
      }
      if (columnFilters.customerName?.trim()) {
        params.append('customerName', columnFilters.customerName.trim());
      }
      if (columnFilters.endpoint?.trim()) {
        params.append('endpoint', columnFilters.endpoint.trim());
      }
      if (columnFilters.terminal?.trim()) {
        params.append('terminal', columnFilters.terminal.trim());
      }
      if (columnFilters.serviceId?.trim()) {
        params.append('serviceId', columnFilters.serviceId.trim());
      }

      fetchLogsWithParams(params);
    } else {
      // Use normal pagination
      fetchLogs(1, '', validationTypeFilter !== 'all' ? validationTypeFilter : '', sortBy, sortOrder, newPageSize);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Fetch all customers without pagination limit for the modal
      const response = await axios.get('/api/customers?limit=1000');
      // Handle the new pagination response structure
      setCustomers(response.data.customers || response.data || []);
    } catch (error) {
      console.log('Error fetching customers:', error);
    }
  };

  const handleEditServiceClick = async (serviceId) => {
    if (!serviceId) return;
    
    setIsServiceLoading(true);
    try {
      const response = await axios.get(`/api/services/${serviceId}`);
      setSelectedService(response.data);
      setServiceModalVisible(true);
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error('Hizmet detayları alınamadı');
    } finally {
      setIsServiceLoading(false);
    }
  };

  const handleServiceSubmit = async (formData) => {
    try {
      if (selectedService) {
        await axios.put(`/api/services/${selectedService.id}`, formData);
        toast.success('Hizmet başarıyla güncellendi');
      } else {
        // Should not happen in this context but keeping for completeness
        await axios.post('/api/services', formData);
      }
      setServiceModalVisible(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error submitting service:', error);
      toast.error('Hizmet kaydedilirken hata oluştu');
    }
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Cleared ${data.deletedCount} logs`);
        // Refresh the logs after clearing
        // Check if we have active column filters
        const hasColumnFilters = Object.values(columnFilters).some(Boolean);

        if (hasColumnFilters) {
          // Use column search to maintain current filters
          handleColumnSearch();
        } else {
          // Use normal pagination
          fetchLogs(1, '', validationTypeFilter !== 'all' ? validationTypeFilter : '', sortBy, sortOrder, pageSize);
        }
      } else {
        console.error('Failed to clear logs');
        alert('Logları temizlerken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Logları temizlerken bir hata oluştu');
    } finally {
      setIsClearing(false);
    }
  };



  return (
    <div className="w-full min-h-full p-6 pt-10 space-y-6">
      {!authenticated ? (
        <div className="text-center py-8">
          Kimlik doğrulanıyor...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Server className="h-8 w-8" />
              API Logları
            </h1>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isClearing}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isClearing ? 'Temizleniyor...' : 'Tüm Logları Temizle'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tüm logları temizlemek istediğinizden emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Tüm API logları kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLogs} className="bg-destructive hover:bg-destructive/90">
                    Evet, Temizle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <LogsTable
            logs={logs}
            loading={loading}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            validationTypeFilter={validationTypeFilter}
            setValidationTypeFilter={setValidationTypeFilter}
            selectedLog={selectedLog}
            setSelectedLog={setSelectedLog}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            pagination={pagination}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearch={handleColumnSearch}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            onEditService={handleEditServiceClick}
          />

          <ServiceModal2
            visible={serviceModalVisible}
            onClose={() => {
              setServiceModalVisible(false);
              setSelectedService(null);
            }}
            onSubmit={handleServiceSubmit}
            selectedService={selectedService}
            customers={customers}
            onRefreshCustomers={fetchCustomers}
            isLoading={isServiceLoading}
          />
        </>
      )}
    </div>
  );
}
