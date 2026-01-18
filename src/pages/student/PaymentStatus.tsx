import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Payment } from '@/lib/api';

export const PaymentStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payment = location.state?.payment as Payment | undefined;

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <p>No payment information found</p>
              <Button onClick={() => navigate('/student/dashboard')} className="mt-4">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isSuccess = payment.status === 'paid';

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        {/* Status Card */}
        <Card className={isSuccess ? 'border-success' : 'border-destructive'}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Basaveshwar Engineering College (BEC)</p>
            <p className="text-muted-foreground mt-2">
              {isSuccess
                ? 'Your fee payment has been processed successfully'
                : 'There was an issue processing your payment. Please try again.'}
            </p>
          </CardHeader>
        </Card>

        {/* Payment Details */}
        {isSuccess && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-medium">{payment.transactionId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Date</p>
                  <p className="font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{payment.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-success">Paid</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">Total Amount Paid</p>
                <p className="text-2xl font-bold text-success">
                  ₹{payment.amount.toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => navigate('/student/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => payment.receiptUrl && window.open(payment.receiptUrl, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isSuccess && (
          <div className="flex gap-3">
            <Button onClick={() => navigate('/student/fees')} className="flex-1">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/student/dashboard')}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
