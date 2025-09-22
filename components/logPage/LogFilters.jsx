'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export function LogFilters({
  columnFilters,
  setColumnFilters,
  validationTypeFilter,
  setValidationTypeFilter,
  onSearch,
  onClearFilters,
  hasActiveFilters
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
        <Input
          placeholder="IP Adresi ara..."
          value={columnFilters.ipAddress}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, ipAddress: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="Servis ID ara..."
          value={columnFilters.serviceId}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, serviceId: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="Servis adı ara..."
          value={columnFilters.serviceName}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, serviceName: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="İşletme adı ara..."
          value={columnFilters.companyName}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, companyName: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="Müşteri ara..."
          value={columnFilters.customerName}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, customerName: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="Endpoint ara..."
          value={columnFilters.endpoint}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, endpoint: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
        <Input
          placeholder="Terminal ara..."
          value={columnFilters.terminal}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, terminal: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="text-sm"
        />
      </div>

      {/* Search and Clear buttons */}
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearch}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Ara
        </Button>
        {hasActiveFilters() && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
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
            onClick={onClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Tüm Filtreleri Temizle
          </Button>
        )}
      </div>
    </div>
  );
}