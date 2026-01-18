import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paymentsApi, Payment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChatWidget } from '@/components/ChatWidget';

export const StudentDashboard = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await paymentsApi.getByStudentId(user?.id || '1');
        setPayments(data);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const pendingPayment = payments.find(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground mt-1">Basaveshwar Engineering College (BEC)</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Pending Fees"
            value={`₹${pendingPayment?.amount.toLocaleString() || 0}`}
            icon={AlertCircle}
          />
          <StatCard
            title="Total Paid"
            value={`₹${totalPaid.toLocaleString()}`}
            icon={CheckCircle}
          />
          <StatCard
            title="Payment History"
            value={paidPayments.length}
            icon={DollarSign}
          />
        </div>

        {/* Pending Payment Alert */}
        {pendingPayment && (
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Pending Fee Payment
                  </CardTitle>
                  <CardDescription>
                    Due date: {new Date(pendingPayment.dueDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/student/fees')}>
                  Pay Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₹{pendingPayment.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes tuition, lab, and library fees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            {paidPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payment history available
              </div>
            ) : (
              <div className="space-y-4">
                {paidPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">Fee Payment</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Transaction ID: {payment.transactionId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChatWidget />
    </DashboardLayout>
  );
};
