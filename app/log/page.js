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
import { Eye, Calendar, Globe, Server, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [validationTypeFilter, setValidationTypeFilter] = useState('all'); // Initialize with 'all' instead of empty string
  const [selectedLog, setSelectedLog] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

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
        router.push('/login');
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      router.push('/login');
    }
  };

  const fetchLogs = async (page = 1, endpoint = '', validationType = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(endpoint && { endpoint }),
        ...(validationType && validationType !== 'all' && { validationType })
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

  useEffect(() => {
    // Fetch logs is now called from checkAuthentication after auth is verified
  }, []);

  const handleSearch = () => {
    fetchLogs(1, searchEndpoint, validationTypeFilter);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage, searchEndpoint, validationTypeFilter);
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
                <div><strong>Device Token:</strong> {log.deviceToken ? `${log.deviceToken.substring(0, 20)}...` : 'N/A'}</div>
                <div><strong>User Agent:</strong> {log.userAgent || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">İstek İçeriği</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                {log.requestBody ? JSON.stringify(JSON.parse(log.requestBody), null, 2) : 'Boş'}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Yanıt İçeriği</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                {log.responseBody ? JSON.stringify(JSON.parse(log.responseBody), null, 2) : 'Boş'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          </div>

      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            External Validation API Logları
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Endpoint ara..."
              value={searchEndpoint}
              onChange={(e) => setSearchEndpoint(e.target.value)}
              className="max-w-sm"
            />
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
            <Button onClick={handleSearch}>Ara</Button>
            {(searchEndpoint || (validationTypeFilter && validationTypeFilter !== 'all')) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchEndpoint('');
                  setValidationTypeFilter('all');
                  fetchLogs(1, '', 'all');
                }}
              >
                Temizle
              </Button>
            )}
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
                    <TableHead className="">Tarih</TableHead>
                    <TableHead className="">IP Adresi</TableHead>
                    <TableHead className="">Servis Adı</TableHead>
                    <TableHead className="">Doğrulama Tipi</TableHead>
                    <TableHead className="">Endpoint</TableHead>
                    <TableHead className="">Durum</TableHead>
                    <TableHead className="">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="">
                  {logs.map((log) => (
                    <TableRow key={log.id} className="">
                      <TableCell className="font-mono text-sm">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="">{log.serviceName || '-'}</TableCell>
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

              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Henüz log kaydı bulunmuyor.
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Toplam {pagination.total} kayıt, sayfa {pagination.page} / {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Sonraki
                      <ChevronRight className="h-4 w-4" />
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
