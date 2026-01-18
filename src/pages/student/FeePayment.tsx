import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { feeStructureApi, paymentsApi, FeeStructure } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ChatWidget } from '@/components/ChatWidget';

export const FeePayment = () => {
  const [feeComponents, setFeeComponents] = useState<FeeStructure[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await feeStructureApi.getAll();
        setFeeComponents(data);

        // Pre-select mandatory fees
        const mandatoryIds = data.filter((f: any) => f.mandatory).map((f: any) => f.id);
        setSelectedFees(new Set(mandatoryIds));
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, []);

  const toggleFee = (feeId: string, isMandatory: boolean) => {
    if (isMandatory) return; // Can't uncheck mandatory fees

    setSelectedFees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(feeId)) newSet.delete(feeId);
      else newSet.add(feeId);
      return newSet;
    });
  };

  const getTotalAmount = () => {
    return feeComponents
      .filter((fee) => selectedFees.has(fee.id))
      .reduce((sum, fee) => sum + fee.amount, 0);
  };

  // ---- REAL Razorpay integration ----
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const totalAmount = getTotalAmount();
      if (totalAmount <= 0) {
        toast({ title: 'Select at least one fee to pay' });
        setIsProcessing(false);
        return;
      }

      // 1) Create order on backend (expects backend to create Razorpay order and return it)
      // paymentsApi.createOrder should call backend POST /api/payments/create-order
      // and return the order object (preferably containing `id` and `amount` (paise))
      const studentId = user?.id || '1';
      const orderResp = await paymentsApi.createOrder(totalAmount, String(studentId));

      // Support shape variations: some helpers return { orderId } others return { id, amount }.
      const orderId = (orderResp && (orderResp.id || orderResp.orderId)) as string | undefined;
      const orderAmount = (orderResp && (orderResp.amount || orderResp.amount_paid || orderResp.total)) || (totalAmount * 100);

      if (!orderId) {
        toast({ title: 'Failed to create order. Please try again.' });
        setIsProcessing(false);
        return;
      }

      // 2) Open Razorpay checkout
      const options: any = {
        key: orderResp?.keyId || 'rzp_test_RiNh11rGGHoyVX',
        amount: orderAmount,               // amount in paise (make sure backend returns paise)
        currency: 'INR',
        name: 'EduPay Fee Payment',
        description: 'College Fee Payment',
        order_id: orderId,
        handler: async function (response: any) {
          // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
          try {
            // 3) Verify payment on backend
            const verifyRes = await paymentsApi.verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );

            // If paymentsApi.verifyPayment returns success indicator, handle accordingly:
            if (verifyRes && (verifyRes.success || verifyRes.status === 'paid')) {
              toast({ title: 'Payment Successful', description: 'Your payment was successful.' });
              navigate('/student/payment-status', { state: { payment: verifyRes } });
            } else {
              toast({ title: 'Payment verification failed', variant: 'destructive' });
            }
          } catch (err) {
            console.error('verify error', err);
            toast({ title: 'Payment verification error', variant: 'destructive' });
          }
        },
        modal: {
          ondismiss: function () {
            // Optional: user closed the checkout
            console.log('Checkout closed by user');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#3399cc' }
      };

      // window.Razorpay is provided by the script added to index.html
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error', error);
      toast({ title: 'Payment Error', description: 'Failed to process payment. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };
  // ---- end Razorpay integration ----

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Fee Payment</h1>
          <p className="text-muted-foreground mt-1">Select fee components and proceed to payment</p>
        </div>

        {/* Fee Components */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Structure</CardTitle>
            <CardDescription>Select the fees you want to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feeComponents.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    id={fee.id}
                    checked={selectedFees.has(fee.id)}
                    onCheckedChange={() => toggleFee(fee.id, fee.mandatory)}
                    disabled={fee.mandatory}
                  />
                  <Label htmlFor={fee.id} className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">{fee.component}</p>
                      {fee.mandatory && <p className="text-xs text-muted-foreground">Mandatory</p>}
                    </div>
                  </Label>
                </div>
                <p className="font-bold">₹{fee.amount.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {feeComponents
                .filter((fee) => selectedFees.has(fee.id))
                .map((fee) => (
                  <div key={fee.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{fee.component}</span>
                    <span>₹{fee.amount.toLocaleString()}</span>
                  </div>
                ))}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{getTotalAmount().toLocaleString()}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing || selectedFees.size === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay ₹{getTotalAmount().toLocaleString()}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">Secure payment powered by Razorpay</p>
          </CardContent>
        </Card>
      </div>

      <ChatWidget />
    </DashboardLayout>
  );
};
