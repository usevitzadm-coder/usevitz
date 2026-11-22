import { useCart } from '@/context/CartContext';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
export default function BlackWeekCouponDialog() {
  const { pendingCoupon, confirmCoupon, cancelCoupon } = useCart();
  return <AlertDialog open={Boolean(pendingCoupon)}><AlertDialogContent onEscapeKeyDown={cancelCoupon}><AlertDialogHeader><AlertDialogTitle>Cupom ou Black Week?</AlertDialogTitle><AlertDialogDescription>Ao aplicar um cupom, você perde a promoção da Black Week. Os descontos não são acumulativos.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={cancelCoupon}>Manter promoção</AlertDialogCancel><AlertDialogAction onClick={confirmCoupon}>Usar cupom</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
