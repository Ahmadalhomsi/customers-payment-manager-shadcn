import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

export function DeleteConfirmModal({ visible, onClose, onConfirm, itemName, itemType, customer, onViewServices }) {
  const hasServices = customer?.services?.length > 0;
  
  if (itemType === 'customer' && hasServices) {
    return (
      <AlertDialog open={visible} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">Silme İşlemi Engellenmiş</AlertDialogTitle>
            <div className="space-y-3">
              <AlertDialogDescription>
                <strong>{itemName}</strong> müşterisini silmek için önce bu müşteriye ait tüm hizmetleri silmelisiniz.
              </AlertDialogDescription>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mevcut hizmet sayısı:</span>
                <Badge variant="destructive" className="text-sm">
                  {customer.services.length} hizmet
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Müşterinin hizmetlerini görüntülemek ve silmek için "Hizmetleri Görüntüle" butonunu kullanabilirsiniz.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kapat</AlertDialogCancel>
            {onViewServices && (
              <AlertDialogAction 
                onClick={() => onViewServices(customer)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Hizmetleri Görüntüle
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Silmeyi Onayla</AlertDialogTitle>
          <AlertDialogDescription>
            {itemType} {itemName} silmek istediğinize emin misiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Sil</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}