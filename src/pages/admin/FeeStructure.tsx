import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { feeStructureApi, FeeStructure } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const AdminFeeStructure = () => {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    component: '',
    amount: '',
    mandatory: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    const data = await feeStructureApi.getAll();
    setFees(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFee) {
        await feeStructureApi.update(editingFee.id, {
          component: formData.component,
          amount: Number(formData.amount),
          mandatory: formData.mandatory
        });
        toast({ title: 'Fee component updated successfully' });
      } else {
        await feeStructureApi.create({
          component: formData.component,
          amount: Number(formData.amount),
          mandatory: formData.mandatory
        });
        toast({ title: 'Fee component added successfully' });
      }

      setIsDialogOpen(false);
      setEditingFee(null);
      setFormData({ component: '', amount: '', mandatory: false });
      fetchFees();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save fee component',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      component: fee.component,
      amount: fee.amount.toString(),
      mandatory: fee.mandatory
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee component?')) return;

    try {
      await feeStructureApi.delete(id);
      toast({ title: 'Fee component deleted successfully' });
      fetchFees();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete fee component',
        variant: 'destructive'
      });
    }
  };

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const mandatoryFees = fees.filter(f => f.mandatory).reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Structure Management</h1>
            <p className="text-muted-foreground mt-1">Configure fee components and amounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingFee(null);
                setFormData({ component: '', amount: '', mandatory: false });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fee Component
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFee ? 'Edit Fee Component' : 'Add New Fee Component'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="component">Component Name *</Label>
                  <Input
                    id="component"
                    required
                    value={formData.component}
                    onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                    placeholder="e.g., Tuition Fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mandatory"
                    checked={formData.mandatory}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, mandatory: checked as boolean })
                    }
                  />
                  <Label htmlFor="mandatory" className="cursor-pointer">
                    Mandatory fee component
                  </Label>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingFee ? 'Update' : 'Add'} Fee Component
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Fee Components</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">₹{totalFees.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Sum of all fee components</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mandatory Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">₹{mandatoryFees.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Required payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Components Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Components ({fees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.component}</TableCell>
                    <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={fee.mandatory ? 'default' : 'secondary'}>
                        {fee.mandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(fee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(fee.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
