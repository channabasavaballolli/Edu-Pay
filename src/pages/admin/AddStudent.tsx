import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsApi, paymentsApi, Payment } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const AddStudent = () => {
  const params = useParams();
  const isEdit = Boolean(params.id);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    course: '',
    year: '',
    branch: '',
    phone: '',
    address: ''
  });
  const [overview, setOverview] = useState<{ outstanding: number; payments: Payment[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudent = async () => {
      if (!isEdit) return;
      try {
        const s = await studentsApi.getById(String(params.id));
        setFormData({
          name: s.name || '',
          email: s.email || '',
          rollNumber: s.rollNumber || '',
          course: s.course || '',
          year: s.year || '',
          branch: s.branch || '',
          phone: s.phone || '',
          address: s.address || '',
        });
        const pay = await paymentsApi.getByStudentId(String(params.id));
        setOverview({ outstanding: s.outstanding || 0, payments: pay });
      } catch {
        // ignore
      }
    };
    fetchStudent();
  }, [isEdit, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await studentsApi.create(formData);
      toast({
        title: 'Student added successfully',
        description: `${formData.name} has been added to the system`
      });
      navigate('/admin/students');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/students')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEdit ? 'Student Details' : 'Add New Student'}</h1>
            <p className="text-muted-foreground mt-1">{isEdit ? 'View stats and edit student information' : 'Enter student details below'}</p>
          </div>
        </div>

        {isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Student Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{formData.name || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reg No</div>
                  <div className="font-medium">{formData.rollNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Course</div>
                  <div className="font-medium">{formData.course || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isEdit && overview && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{overview.outstanding.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.payments.length === 0 ? (
                  <p className="text-muted-foreground">No payments found</p>
                ) : (
                  <div className="space-y-2">
                    {overview.payments.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">₹{p.amount.toLocaleString()}</span>
                          <span className="ml-2 text-muted-foreground">{p.status}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                        </div>
                        {p.status === 'paid' && p.receiptUrl && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(p.receiptUrl, '_blank')}>Receipt</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Information' : 'Student Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      required
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Academic Information</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select
                      value={formData.course}
                      onValueChange={(value) => setFormData({ ...formData, course: value })}
                    >
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="BCA">BCA</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(value) => setFormData({ ...formData, year: value })}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch *</Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData({ ...formData, branch: value })}
                    >
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Student
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/students')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
