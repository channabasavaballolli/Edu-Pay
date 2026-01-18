import { useEffect, useState } from 'react';
import { DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { reportsApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportsApi.getDashboardStats();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Basaveshwar Engineering College (BEC)</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Collection"
            value={`₹${stats.totalCollection.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Pending Dues"
            value={`₹${stats.pendingDues.toLocaleString()}`}
            icon={XCircle}
          />
          <StatCard
            title="Students Paid"
            value={stats.studentsPaid}
            icon={CheckCircle}
          />
          <StatCard
            title="Students Not Paid"
            value={stats.studentsNotPaid}
            icon={Users}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Collection by Year */}
          <Card>
            <CardHeader>
              <CardTitle>Collection by Year</CardTitle>
              <CardDescription>Fee collection across different academic years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.collectionByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Collection by Course */}
          <Card>
            <CardHeader>
              <CardTitle>Collection by Course</CardTitle>
              <CardDescription>Distribution of fee collection by course</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.collectionByCourse}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ course, percent }) => `${course}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {stats.collectionByCourse.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/admin/students/add"
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Add New Student</p>
              </a>
              <a
                href="/admin/payments"
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
              >
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">View All Payments</p>
              </a>
              <a
                href="/admin/reports"
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
              >
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Generate Reports</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
