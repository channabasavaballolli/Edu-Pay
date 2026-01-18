import { useState } from 'react';
import { Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    collegeName: 'Basaveshwar Engineering College (BEC)',
    collegeAddress: 'Mumbai, Maharashtra, India',
    collegeEmail: 'admin@xyzcollege.edu',
    collegePhone: '+91 22 1234 5678',
    razorpayKeyId: 'rzp_test_xxxxxxxxxxxx',
    razorpayKeySecret: '••••••••••••••••'
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your changes have been saved successfully'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage system configuration and preferences
          </p>
        </div>

        {/* College Information */}
        <Card>
          <CardHeader>
            <CardTitle>College Information</CardTitle>
            <CardDescription>Basic information about your institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collegeName">College Name</Label>
              <Input
                id="collegeName"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collegeAddress">Address</Label>
              <Input
                id="collegeAddress"
                value={settings.collegeAddress}
                onChange={(e) => setSettings({ ...settings, collegeAddress: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collegeEmail">Email</Label>
                <Input
                  id="collegeEmail"
                  type="email"
                  value={settings.collegeEmail}
                  onChange={(e) => setSettings({ ...settings, collegeEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collegePhone">Phone</Label>
                <Input
                  id="collegePhone"
                  value={settings.collegePhone}
                  onChange={(e) => setSettings({ ...settings, collegePhone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway Configuration</CardTitle>
            <CardDescription>
              Configure Razorpay payment gateway settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
              <Input
                id="razorpayKeyId"
                value={settings.razorpayKeyId}
                onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
              <Input
                id="razorpayKeySecret"
                type="password"
                value={settings.razorpayKeySecret}
                onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Get your Razorpay API keys from the Razorpay Dashboard.
                Never share these keys publicly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Account */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Account</CardTitle>
            <CardDescription>Manage your admin account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" type="email" value="admin@edupay.com" disabled />
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
