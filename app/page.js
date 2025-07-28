"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerTable } from '../components/mainPage/CustomersTable'
import { CustomerModal } from '../components/mainPage/CustomerModal'
import { DeleteConfirmModal } from '../components/mainPage/DeleteConfirmModal'
import { ServiceModal } from '../components/mainPage/ServiceModal'
import { ServicesViewModal } from '../components/mainPage/ServicesViewModal'
import { RemindersViewModal } from '../components/mainPage/RemindersViewModal'
import { ReminderModal } from '../components/mainPage/ReminderModal'
import { Plus, Mail, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react'
import { toast } from "sonner"

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [customerModalVisible, setCustomerModalVisible] = useState(false)
  const [deleteCustomerConfirmVisible, setDeleteCustomerConfirmVisible] = useState(false)
  const [serviceModalVisible, setServiceModalVisible] = useState(false)
  const [servicesViewModalVisible, setServicesViewModalVisible] = useState(false)
  const [deleteServiceConfirmVisible, setDeleteServiceConfirmVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOnModal, setLoadingOnModal] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [reminderViewModalVisible, setReminderViewModalVisible] = useState(false);
  const [deleteReminderConfirmVisible, setDeleteReminderConfirmVisible] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState(null);
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
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
    fetchAdminData();
    fetchCustomers();

    // Global keyboard shortcuts
    const handleKeyDown = (event) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.querySelector('input[placeholder*="Müşteri adı"]')?.focus();
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
  }, []);

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      try {
        await axios.delete(`/api/customers/${selectedCustomer.id}`);
        fetchCustomers(pagination.page, searchTerm, sortBy, sortOrder);
        setDeleteCustomerConfirmVisible(false);
      } catch (error) {
        if (error.status === 403) {
          toast.error('Yasak: Müşteri silme izniniz yok')
        }
        else
          console.log('Error deleting customer:', error)
      }
    }
  };

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


  const handleServiceSubmit = async (serviceFormData) => {
    try {
      if (selectedCustomer) {
        if (selectedService) {
          await axios.put(`/api/services/${selectedService.id}`, {
            ...serviceFormData,
            customerID: selectedCustomer.id
          });
        } else {
          await axios.post(`/api/services`, {
            ...serviceFormData,
            customerID: selectedCustomer.id
          });
        }
        setServiceModalVisible(false);
        if (servicesViewModalVisible) {
          await fetchServices(selectedCustomer.id);
        }
      }
      fetchCustomers(pagination.page, searchTerm, sortBy, sortOrder);
    } catch (error) {
      console.log('Error adding/updating service:', error);
    }
  };

  const sendSMTPemail = async () => {
    try {
      const res = await axios.post('/api/mailer')
      console.log('Email sent successfully');
    } catch (error) {
      console.log('Error sending email:', error);
    }
  }

  // Fetch functions remain the same
  async function fetchCustomers(page = 1, search = '', sortField = sortBy, order = sortOrder) {
    try {
      setLoading(true);
      
      // Validate page parameter
      const validPage = Math.max(1, parseInt(page) || 1);
      
      const params = new URLSearchParams({
        page: validPage.toString(),
        limit: pageSize.toString(),
        search,
        sortBy: sortField,
        sortOrder: order
      });
      
      const response = await axios.get(`/api/customers?${params}`)
      if (response.status === 206) {
        toast.error('Yasak: Müşteri parolalarını görüntüleme izniniz yok')
      }
      
      // Update customers and pagination
      setCustomers(response.data.customers || [])
      const newPagination = response.data.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0
      }
      
      // Check if current page exceeds total pages and redirect to last page
      if (newPagination.totalPages > 0 && validPage > newPagination.totalPages) {
        // Recursively fetch the last valid page
        return fetchCustomers(newPagination.totalPages, search, sortField, order);
      }
      
      setPagination(newPagination)
    } catch (error) {
      if (error.status === 403) {
        toast.error('Yasak: Müşterileri görüntüleme izniniz yok')
      }
      else
        console.log('Müşterileri getirirken hata oluştu:', error)

    }
    setLoading(false)
  }

  async function fetchServices(customerId) {
    setLoadingOnModal(true);
    try {
      const response = await axios.get(`/api/services/customer/${customerId}`);
      // Sort services by creation date (newest first) to show new services at the top
      const sortedServices = response.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      setServices(sortedServices);
    } catch (error) {
      if (error.status === 403) {
        toast.error('Yasak: Hizmetleri görüntüleme izniniz yok')
      }
      else
        console.log('Error fetching services:', error)
    }
    setLoadingOnModal(false);
  }



  // Modal handlers remain similar
  const handleCustomerSubmit = async (formData) => {
    try {
      if (selectedCustomer) {
        try {
          await axios.put(`/api/customers/${selectedCustomer.id}`, formData);
          fetchCustomers(pagination.page, searchTerm);
        } catch (error) {
          if (error.status === 403) {
            toast.error('Yasak: Müşteri güncelleme izniniz yok')
          }
          else
            console.log('Error updating customer:', error)
        }
      } else {
        try {
          await axios.post('/api/customers', formData);
        } catch (error) {
          if (error.status === 403) {
            toast.error('Yasak: Müşteri ekleme izniniz yok')
          }
          else
            console.log('Error adding customer:', error)
        }
      }
      setCustomerModalVisible(false);
      setSelectedCustomer(null); // Reset selected customer after submission
      // add the customer to the list
      fetchCustomers(pagination.page, searchTerm);
    } catch (error) {
      console.log('Error submitting customer:', error);
    }
  };

  // Pagination handlers
  const handleSearch = () => {
    fetchCustomers(1, searchTerm, sortBy, sortOrder);
  };

  const handlePageChange = (newPage) => {
    // Validate page number
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchCustomers(newPage, searchTerm, sortBy, sortOrder);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPagination(prev => ({ ...prev, page: 1, limit: newPageSize }));
    fetchCustomers(1, searchTerm, sortBy, sortOrder);
  };

  return (
    <div className="w-full min-h-full pt-6">
      <div className="flex flex-col gap-4 mb-4 px-4">
        <div className="flex gap-2">
          {permissions?.canEditCustomers && (
            <Button onClick={() => {
              setSelectedCustomer(null); // Ensure selectedCustomer is reset
              setCustomerModalVisible(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Müşteri Ekle
            </Button>
          )}
        </div>
        
        {/* Search and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Müşteri Arama ve Filtreleme</span>
              <div className="text-xs text-muted-foreground">
                Ctrl+F: Arama | Enter: Ara | Esc: Temizle
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Müşteri adı, email, telefon veya tablo adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  } else if (e.key === 'Escape') {
                    setSearchTerm('');
                    fetchCustomers(1, '', sortBy, sortOrder);
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
                    fetchCustomers(1, '', sortBy, sortOrder);
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
        <CustomerTable
          customers={customers}
          services={services}
          isLoading={loading}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          onEdit={(customer) => {
            setSelectedCustomer(customer)
            setCustomerModalVisible(true)
          }}
          onDelete={(customer) => {
            setSelectedCustomer(customer)
            setDeleteCustomerConfirmVisible(true)
          }}
          onAddService={(customer) => {
            setSelectedCustomer(customer);
            setSelectedService(null);  // Reset service selection
            setServiceModalVisible(true);
          }}
          onViewServices={(customer) => {
            fetchServices(customer.id)
            setSelectedCustomer(customer)
            setServicesViewModalVisible(true)
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
                
                if (total <= 7) {
                  // If 7 or fewer pages, show all
                  for (let i = 1; i <= total; i++) {
                    showPages.push(i);
                  }
                } else {
                  // Always show first page
                  showPages.push(1);
                  
                  // Calculate start and end of middle range
                  let start = Math.max(2, current - 1);
                  let end = Math.min(total - 1, current + 1);
                  
                  // Adjust range to ensure we show at least 3 pages in the middle
                  if (current <= 3) {
                    start = 2;
                    end = Math.min(5, total - 1);
                  } else if (current >= total - 2) {
                    start = Math.max(2, total - 4);
                    end = total - 1;
                  }
                  
                  // Add ellipsis if there's a gap after first page
                  if (start > 2) {
                    showPages.push('...');
                  }
                  
                  // Add middle pages (avoiding duplicates)
                  for (let i = start; i <= end; i++) {
                    if (i > 1 && i < total) { // Avoid duplicating first and last page
                      showPages.push(i);
                    }
                  }
                  
                  // Add ellipsis if there's a gap before last page
                  if (end < total - 1) {
                    showPages.push('...');
                  }
                  
                  // Always show last page (if it's not the same as first page)
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
      </div>

      {/* Modals */}
      <CustomerModal
        visible={customerModalVisible}
        onClose={() => {
          setCustomerModalVisible(false);
          setSelectedCustomer(null); // Reset on close
        }}
        onSubmit={handleCustomerSubmit}
        selectedCustomer={selectedCustomer}
        customers={customers}
      />

      <DeleteConfirmModal
        visible={deleteCustomerConfirmVisible}
        onClose={() => setDeleteCustomerConfirmVisible(false)}
        onConfirm={handleDeleteCustomer}
        itemName={selectedCustomer?.name}
        itemType="customer"
      />

      <ServiceModal
        visible={serviceModalVisible}
        onClose={() => {
          setServiceModalVisible(false);
          setSelectedService(null);  // Clear service selection
        }}
        onSubmit={handleServiceSubmit}
        selectedCustomer={selectedCustomer}
        selectedService={selectedService}  // This should now be null for new services
      />

      <ServicesViewModal
        visible={servicesViewModalVisible}
        onClose={() => {
          setServicesViewModalVisible(false)
          setServices([])
        }}
        services={services}
        loadingOnModal={loadingOnModal}
        selectedCustomer={selectedCustomer}
        onEditService={(service) => {
          setSelectedService(service); // Keep the service data including dates
          setServiceModalVisible(true);
        }}
        onDeleteService={async (service) => {
          setSelectedService(service)
          setDeleteServiceConfirmVisible(true)
          try {
            await axios.delete(`/api/services/${service.id}`)
            fetchServices(selectedCustomer.id)
            fetchCustomers(pagination.page, searchTerm, sortBy, sortOrder)
          } catch (error) {
            console.log('Error deleting service:', error)
          }
        }}
        onViewReminders={(service) => {
          setSelectedService(service)
          setServicesViewModalVisible(false)
          setReminderViewModalVisible(true)
        }}
        onAddService={() => {
          setSelectedService(null)
          setServiceModalVisible(true)
        }}
      />

      <RemindersViewModal
        visible={reminderViewModalVisible}
        onClose={() => {
          setReminderViewModalVisible(false)
          setSelectedService(null)
        }}
        reminders={selectedService?.reminders || []}
        onCreateNewReminder={() => {
          setSelectedReminder(null)
          setReminderModalVisible(true)
        }}
        onEditReminder={(reminder) => {
          setSelectedReminder({
            ...reminder,
            scheduledAt: new Date(reminder.scheduledAt)
          })
          setReminderViewModalVisible(false)
          setReminderModalVisible(true)
        }}
        onDeleteReminder={async (reminder) => {
          try {
            await axios.delete(`/api/reminders/${reminder.id}`)
            // Refresh service data
            const serviceRes = await axios.get(`/api/services/${selectedService.id}?includeReminders=true`)
            setSelectedService(serviceRes.data)
          } catch (error) {
            if (error.status === 403) {
              toast.error('Yasak: Hatırlatıcı silme izniniz yok')
            }
            else
              console.log('Error deleting reminder:', error)
          }
        }}
        loading={loadingOnModal}
      />

      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onSubmit={async (reminderData) => {
          try {
            if (selectedReminder) {
              try {
                await axios.put(`/api/reminders/${selectedReminder.id}`, reminderData)
              } catch (error) {
                if (error.status === 403) {
                  toast.error('Yasak: Hatırlatıcı güncelleme izniniz yok')
                }
                else
                  console.log('Error updating reminder:', error)
              }
            } else {
              try {
                await axios.post('/api/reminders', {
                  ...reminderData,
                  serviceID: selectedService.id
                })
              } catch (error) {
                if (error.status === 403) {
                  toast.error('Yasak: Hatırlatıcı oluşturma izniniz yok')
                }
                else
                  console.log('Error creating reminder:', error)
              }
            }

            // Refresh service data with reminders
            const serviceRes = await axios.get(`/api/services/${selectedService.id}?includeReminders=true`)
            setSelectedService(serviceRes.data)

            setReminderModalVisible(false)
            setSelectedReminder(null)
          } catch (error) {
            console.error('Error saving reminder:', error)
          }
        }}
        selectedReminder={selectedReminder}
      />
    </div>
  )
}