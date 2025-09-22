'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Calendar, Globe, Server, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, Trash2, X, Search } from 'lucide-react';

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

  // Add function to filter logs based on column filters (client-side, minimal)
  const getFilteredLogs = () => {
    // Since we're using server-side search now, minimal client-side filtering
    return logs;
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

  const SortableHeader = ({ field, children }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === field && (
          sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

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

  const getStatusBadge = (status) => {
    if (status >= 200 && status < 300) {
      return <Badge variant="default" className="bg-green-500">Success</Badge>;
    } else if (status >= 400 && status < 500) {
      return <Badge variant="destructive" className="">Client Error</Badge>;
    } else if (status >= 500) {
      return <Badge variant="destructive" className="bg-red-600">Server Error</Badge>;
    }
    return <Badge variant="secondary" className="">{status}</Badge>;
  };

  const getValidationTypeBadge = (validationType) => {
    if (validationType === 'Trial') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Trial</Badge>;
    } else if (validationType === 'Sisteme Giriş') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sisteme Giriş</Badge>;
    } else if (validationType === 'Existing Service') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Existing Service</Badge>;
    }
    return <Badge variant="secondary" className="">Unknown</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const LogDetailModal = ({ log }) => {
    if (!log) return null;

    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="">
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Log Detayları
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">İstek Bilgileri</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Endpoint:</strong> {log.endpoint}</div>
                <div><strong>Method:</strong> {log.method}</div>
                <div><strong>IP Adresi:</strong> {log.ipAddress}</div>
                <div><strong>Tarih:</strong> {formatDate(log.createdAt)}</div>
                <div><strong>Doğrulama Tipi:</strong> {getValidationTypeBadge(log.validationType)}</div>
                <div><strong>Durum:</strong> {getStatusBadge(log.responseStatus)}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Servis Bilgileri</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Servis Adı:</strong> {log.serviceName || 'N/A'}</div>
                <div><strong>İşletme Adı:</strong> {(() => {
                  try {
                    const requestData = JSON.parse(log.requestBody || '{}');
                    return requestData.companyName || 'N/A';
                  } catch {
                    return 'N/A';
                  }
                })()}</div>
                <div><strong>Müşteri:</strong> {log.customer ? (
                  <span>
                    {log.customer.name}
                    {log.customer.tableName && ` (${log.customer.tableName})`}
                  </span>
                ) : 'N/A'}</div>
                <div><strong>Terminal:</strong> {(() => {
                  try {
                    const requestData = JSON.parse(log.requestBody || '{}');
                    return requestData.terminal || 'N/A';
                  } catch {
                    return 'N/A';
                  }
                })()}</div>
                <div><strong>Device Token:</strong> {log.deviceToken ? `${log.deviceToken.substring(0, 20)}...` : 'N/A'}</div>
                <div><strong>User Agent:</strong> {log.userAgent || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">İstek İçeriği</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 text-foreground">
                {log.requestBody ? JSON.stringify(JSON.parse(log.requestBody), null, 2) : 'Boş'}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Yanıt İçeriği</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 text-foreground">
                {log.responseBody ? JSON.stringify(JSON.parse(log.responseBody), null, 2) : 'Boş'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    );
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

      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              External Validation API Logları
            </div>
            <div className="text-xs text-muted-foreground">
              Ctrl+F: İlk filtreye odaklan | Ctrl+Enter: Filtreleri temizle
            </div>
          </CardTitle>
          
          {/* Column-specific search filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
              <Input
                placeholder="IP Adresi ara..."
                value={columnFilters.ipAddress}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, ipAddress: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="Servis adı ara..."
                value={columnFilters.serviceName}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, serviceName: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="İşletme adı ara..."
                value={columnFilters.companyName}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, companyName: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="Müşteri ara..."
                value={columnFilters.customerName}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, customerName: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="Endpoint ara..."
                value={columnFilters.endpoint}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, endpoint: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="Terminal ara..."
                value={columnFilters.terminal}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, terminal: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
              <Input
                placeholder="Servis ID ara..."
                value={columnFilters.serviceId}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, serviceId: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleColumnSearch()}
                className="text-sm"
              />
            </div>
            
            {/* Search and Clear buttons */}
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleColumnSearch}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Ara
              </Button>
              {hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Filtreleri Temizle
                </Button>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap items-center">
              <Select value={validationTypeFilter} onValueChange={setValidationTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Doğrulama Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="Sisteme Giriş">Sisteme Giriş</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Existing Service">Existing Service</SelectItem>
                </SelectContent>
              </Select>
              
              {hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tüm Filtreleri Temizle
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="">
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : (
            <>
              <Table className="">
                <TableHeader className="">
                  <TableRow className="">
                    <SortableHeader field="createdAt">Tarih</SortableHeader>
                    <SortableHeader field="ipAddress">IP Adresi</SortableHeader>
                    <SortableHeader field="serviceName">Servis Adı</SortableHeader>
                    <TableHead className="">İşletme Adı</TableHead>
                    <TableHead className="">Müşteri</TableHead>
                    <TableHead className="">Terminal</TableHead>
                    <TableHead className="">Servis ID</TableHead>
                    <TableHead className="">Doğrulama Tipi</TableHead>
                    <TableHead className="">Endpoint</TableHead>
                    <SortableHeader field="responseStatus">Durum</SortableHeader>
                    <TableHead className="">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="">
                  {getFilteredLogs().map((log) => (
                    <TableRow key={log.id} className="">
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="">{log.serviceName || '-'}</TableCell>
                      <TableCell className="">{(() => {
                        try {
                          const requestData = JSON.parse(log.requestBody || '{}');
                          return requestData.companyName || '-';
                        } catch {
                          return '-';
                        }
                      })()}</TableCell>
                      <TableCell className="">{log.customer?.name || '-'}</TableCell>
                      <TableCell className="">{(() => {
                        try {
                          const requestData = JSON.parse(log.requestBody || '{}');
                          return requestData.terminal || '-';
                        } catch {
                          return '-';
                        }
                      })()}</TableCell>
                      <TableCell className="">{(() => {
                        // Display service ID if available
                        if (log.serviceId) {
                          return (
                            <span className="font-mono text-xs">
                              {log.serviceId.substring(0, 8)}...
                            </span>
                          );
                        }
                        return '-';
                      })()}</TableCell>
                      <TableCell className="">{getValidationTypeBadge(log.validationType)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="outline" className="">{log.method}</Badge> {log.endpoint}
                      </TableCell>
                      <TableCell className="">{getStatusBadge(log.responseStatus)}</TableCell>
                      <TableCell className="">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <LogDetailModal log={selectedLog} />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {getFilteredLogs().length === 0 && logs.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  Filtre kriterlerinize uygun log bulunamadı.
                </div>
              )}

              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Henüz log kaydı bulunmuyor.
                </div>
              )}

              {pagination.totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {(getFilteredLogs().length !== logs.length || validationTypeFilter !== 'all' || Object.values(columnFilters).some(filter => filter.trim() !== ''))
                        ? `${getFilteredLogs().length} / ${logs.length} kayıt gösteriliyor (${pagination.total} toplam)`
                        : `Toplam ${pagination.total} kayıt, sayfa ${pagination.page} / ${pagination.totalPages}`
                      }
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
            </>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
