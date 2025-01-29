"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ServiceTable } from '@/components/servicesPage/ServicesTable'
import { ServiceModal2 } from '@/components/servicesPage/ServiceModal2'
import { DeleteConfirmModal } from '@/components/mainPage/DeleteConfirmModal'
import { Plus, Mail } from 'lucide-react'
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

  useEffect(() => {
    fetchServices()
    fetchCustomers()
    fetchAdminData();

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

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/services')
      setServices(response.data)
    } catch (error) {
      if (error.response.status === 403)
        toast.error('Yasak: Hizmet görüntüleme izniniz yok')
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      setCustomers(response.data)
    } catch (error) {
      if (error.response.status === 403)
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
        fetchServices()
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
      await fetchServices() // Ensure fetch completes before closing modal
      setServiceModalVisible(false)
      setSelectedService(null)
    } catch (error) {
      console.log('Error submitting service:', error)
      alert('Failed to save service. Please try again.') // User feedback
    }
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">

        {permissions?.canEditServices && (<Button onClick={() => {
          setSelectedService(null)
          setServiceModalVisible(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Hizmet Ekle
        </Button>
        )}
      </div>

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