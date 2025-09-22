'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function LogPagination({
  pagination,
  pageSize,
  logs,
  columnFilters,
  validationTypeFilter,
  onPageChange,
  onPageSizeChange
}) {
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
        showPages.push('ellipsis-start');
      }
      
      // Add pages in the middle range
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i !== 1 && i !== total) { // Don't duplicate first or last page
          showPages.push(i);
        }
      }
      
      // Add ellipsis before last page if needed
      if (rangeEnd < total - 1) {
        showPages.push('ellipsis-end');
      }
      
      // Always add last page if it's different from first page
      if (total > 1) {
        showPages.push(total);
      }
    }
    
    return showPages.map((page, index) => {
      if (page === 'ellipsis-start' || page === 'ellipsis-end') {
        return <span key={page} className="px-2 text-muted-foreground">...</span>;
      }
      return (
        <Button
          key={`page-${page}`}
          variant={page === current ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="w-8 h-8 p-0"
        >
          {page}
        </Button>
      );
    });
  };

  const hasActiveFilters = () => {
    return Object.values(columnFilters).some(Boolean) ||
      validationTypeFilter !== 'all';
  };

  if (pagination.totalPages === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters()
            ? `${logs.length} / ${logs.length} kayıt gösteriliyor (${pagination.total} toplam)`
            : `Toplam ${pagination.total} kayıt, sayfa ${pagination.page} / ${pagination.totalPages}`
          }
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sayfa başına:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
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
          onClick={() => onPageChange(1)}
          disabled={pagination.page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {renderPaginationNumbers()}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.totalPages)}
          disabled={pagination.page >= pagination.totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}