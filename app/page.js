"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '../components/mainPage/CustomersTable'
import { CustomerModal } from '../components/mainPage/CustomerModal'
import { DeleteConfirmModal } from '../components/mainPage/DeleteConfirmModal'
import { ServiceModal } from '../components/mainPage/ServiceModal'
import { ServicesViewModal } from '../components/mainPage/ServicesViewModal'
import { RemindersViewModal } from '../components/mainPage/RemindersViewModal'
import { ReminderModal } from '../components/mainPage/ReminderModal'
import { Plus, Mail } from 'lucide-react'
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

  useEffect(() => {
    fetchAdminData();
    fetchCustomers();
  }, []);

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      try {
        await axios.delete(`/api/customers/${selectedCustomer.id}`);
        fetchCustomers();
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
      fetchCustomers();
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
  async function fetchCustomers() {
    try {
      setLoading(true);
      const response = await axios.get('/api/customers')
      if (response.status === 206) {
        toast.error('Yasak: Müşteri parolalarını görüntüleme izniniz yok')
      }
      // Sort customers by creation date (newest first) to show new customers at the top
      const sortedCustomers = response.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      setCustomers(sortedCustomers)
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
          fetchCustomers();
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
      fetchCustomers();
    } catch (error) {
      console.log('Error submitting customer:', error);
    }
  };

  return (
    <div className="w-full min-h-full pt-6">
      <div className="flex gap-2 mb-4 px-4">
        {permissions?.canEditCustomers && (
          <Button onClick={() => {
            setSelectedCustomer(null); // Ensure selectedCustomer is reset
            setCustomerModalVisible(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Müşteri Ekle
          </Button>
        )}
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
            fetchCustomers()
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