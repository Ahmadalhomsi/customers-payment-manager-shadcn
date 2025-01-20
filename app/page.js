"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CustomerTable } from '../components/mainPage/CustomerTable'
import { CustomerModal } from '../components/mainPage/CustomerModal'
import { DeleteConfirmModal } from '../components/mainPage/DeleteConfirmModal'
import { ServiceModal } from '../components/mainPage/ServiceModal'
import { ServicesViewModal } from '../components/mainPage/ServicesViewModal'
// import { ReminderModal } from '../components/mainPage/ReminderModal'
import { ReminderViewModal } from '../components/mainPage/ReminderViewModal'
import { Plus, Mail } from 'lucide-react'

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
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderViewModalVisible, setReminderViewModalVisible] = useState(false);
  const [deleteReminderConfirmVisible, setDeleteReminderConfirmVisible] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      try {
        await axios.delete(`/api/customers/${selectedCustomer.id}`);
        fetchCustomers();
        setDeleteCustomerConfirmVisible(false);
      } catch (error) {
        console.log('Error deleting customer:', error);
      }
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
      const response = await axios.get('/api/customers')
      setCustomers(response.data)
    } catch (error) {
      console.log('Error fetching customers:', error)
    }
  }

  async function fetchServices(customerId) {
    setLoadingOnModal(true);
    try {
      const response = await axios.get(`/api/services/${customerId}`);
      setServices(response.data);
    } catch (error) {
      console.log('Error fetching services:', error);
    }
    setLoadingOnModal(false);
  }

  // Modal handlers remain similar
  const handleCustomerSubmit = async (formData) => {
    try {
      if (selectedCustomer) {
        await axios.put(`/api/customers/${selectedCustomer.id}`, formData)
      } else {
        await axios.post('/api/customers', formData)
      }
      fetchCustomers()
      setCustomerModalVisible(false)
    } catch (error) {
      console.log('Error submitting customer:', error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setCustomerModalVisible(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Customer
        </Button>
        <Button variant="outline" onClick={sendSMTPemail}>
          <Mail className="mr-2 h-4 w-4" /> Send Email
        </Button>
      </div>

      <CustomerTable
        customers={customers}
        loading={loading}
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
          setSelectedCustomer(customer)
          setServiceModalVisible(true)
        }}
        onViewServices={(customer) => {
          fetchServices(customer.id)
          setSelectedCustomer(customer)
          setServicesViewModalVisible(true)
        }}
      />

      {/* Modals */}
      <CustomerModal
        visible={customerModalVisible}
        onClose={() => setCustomerModalVisible(false)}
        onSubmit={handleCustomerSubmit}
        selectedCustomer={selectedCustomer}
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
        onClose={() => setServiceModalVisible(false)}
        onSubmit={handleServiceSubmit}
        selectedCustomer={selectedCustomer}
        selectedService={selectedService}
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
          setSelectedService({
            ...service,
            startingDate: parseDate(format(service.startingDate.toString().split('T')[0], 'yyyy-MM-dd')),
            endingDate: parseDate(format(service.endingDate.toString().split('T')[0], 'yyyy-MM-dd'))
          })
          setServicesViewModalVisible(false)
          setServiceModalVisible(true)
        }}
        onDeleteService={(service) => {
          setSelectedService(service)
          setServicesViewModalVisible(false)
          setDeleteServiceConfirmVisible(true)
        }}
        onViewReminders={(service) => {
          setSelectedService(service)
          setServicesViewModalVisible(false)
          setReminderViewModalVisible(true)
        }}
      />

      <ReminderViewModal
        visible={reminderViewModalVisible}
        onClose={() => {
          setReminderViewModalVisible(false)
          setSelectedService(null)
        }}
        reminders={selectedService?.reminders || []}
        onCreateNewReminder={() => {
          setReminderModalVisible(true)
        }}
        onEditReminder={(reminder) => {
          setSelectedReminder({
            ...reminder,
            scheduledAt: parseDate(format(reminder.scheduledAt.toString().split('T')[0], 'yyyy-MM-dd'))
          })
          setReminderViewModalVisible(false)
          setReminderModalVisible(true)
        }}
        onDeleteReminder={(reminder) => {
          setReminderToDelete(reminder)
          setDeleteReminderConfirmVisible(true)
        }}
        loading={loadingOnModal}
      />
    </div>
  )
}