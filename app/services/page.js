"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ServiceTable } from '@/components/servicesPage/ServicesTable'
import { ServiceModal } from '@/components/mainPage/ServiceModal'
import { DeleteConfirmModal } from '@/components/mainPage/DeleteConfirmModal'
import { Plus, Mail } from 'lucide-react'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [serviceModalVisible, setServiceModalVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState(null)
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetchServices()
    fetchCustomers()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/services')
      setServices(response.data)
    } catch (error) {
      console.log('Error fetching services:', error)
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      setCustomers(response.data)
    } catch (error) {
      console.log('Error fetching customers:', error)
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
      fetchServices()
      setServiceModalVisible(false)
      setSelectedService(null)
    } catch (error) {
      console.log('Error submitting service:', error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <Button onClick={() => {
          setSelectedService(null)
          setServiceModalVisible(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Create Service
        </Button>
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
      />

      <ServiceModal
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
    </div>
  )
}