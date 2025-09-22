'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { LogFilters } from './LogFilters';
import { LogTable } from './LogTable';
import { LogPagination } from './LogPagination';

export function LogsTable({
  logs,
  loading,
  columnFilters,
  setColumnFilters,
  validationTypeFilter,
  setValidationTypeFilter,
  selectedLog,
  setSelectedLog,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onClearFilters,
  hasActiveFilters
}) {
  return (
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

        <LogFilters
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          validationTypeFilter={validationTypeFilter}
          setValidationTypeFilter={setValidationTypeFilter}
          onSearch={onSearch}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </CardHeader>
      <CardContent className="">
        {loading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <>
            <LogTable
              logs={logs}
              selectedLog={selectedLog}
              setSelectedLog={setSelectedLog}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />

            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Filtre kriterlerinize uygun log bulunamadı.
              </div>
            )}

            <LogPagination
              pagination={pagination}
              pageSize={pageSize}
              logs={logs}
              columnFilters={columnFilters}
              validationTypeFilter={validationTypeFilter}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}