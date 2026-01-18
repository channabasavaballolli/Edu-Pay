import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const AdminReports = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: 'daily' | 'weekly' | 'yearly', format: 'pdf' | 'csv') => {
    setIsGenerating(true);

    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      let fromStr = todayStr;
      let toStr = todayStr;
      if (type === 'weekly') {
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const start = new Date(today);
        start.setDate(today.getDate() + diffToMonday);
        const sy = start.getFullYear();
        const sm = String(start.getMonth() + 1).padStart(2, '0');
        const sd = String(start.getDate()).padStart(2, '0');
        fromStr = `${sy}-${sm}-${sd}`;
        toStr = todayStr;
      } else if (type === 'yearly') {
        fromStr = `${yyyy}-01-01`;
        toStr = todayStr;
      }
      const opts = { from: fromStr, to: toStr };
      const result = format === 'pdf'
        ? await reportsApi.exportPDF(type, opts)
        : await reportsApi.exportCSV(type, opts);

      if ((result as any).blob && (result as any).filename) {
        const blobUrl = URL.createObjectURL((result as any).blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = (result as any).filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } else if ((result as any).url) {
        window.open((result as any).url, '_blank');
      }

      toast({
        title: 'Report generated',
        description: `${type} report has been generated successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Basaveshwar Engineering College (BEC)</p>
        </div>

        {/* Report Types */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Daily Report */}
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Daily Report</CardTitle>
              <CardDescription>Today's fee collection summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('daily', 'pdf')}
                disabled={isGenerating}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('daily', 'csv')}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Report */}
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Weekly Report</CardTitle>
              <CardDescription>This week's collection data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('weekly', 'pdf')}
                disabled={isGenerating}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('weekly', 'csv')}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Report */}
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Yearly Report</CardTitle>
              <CardDescription>Annual fee collection overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('yearly', 'pdf')}
                disabled={isGenerating}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('yearly', 'csv')}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Defaulters Report */}
        <Card>
          <CardHeader>
            <CardTitle>Defaulter List</CardTitle>
            <CardDescription>
              Students who haven't paid their fees by the due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => handleExport('weekly', 'pdf')}
                disabled={isGenerating}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Defaulter Report (PDF)
              </Button>
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => handleExport('weekly', 'csv')}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Defaulter List (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Information */}
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• All reports include detailed transaction information</p>
              <p>• PDF reports contain formatted tables and charts</p>
              <p>• CSV exports can be opened in Excel or Google Sheets</p>
              <p>• Reports are generated in real-time with current data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
