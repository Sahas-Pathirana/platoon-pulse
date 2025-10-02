// Achievements report CSV download function
const downloadAchievementsReportCSV = async (options?: { type: 'cadet', cadetId: string } | { type: 'platoon', platoon: string }) => {
  try {
    // Fetch achievements joined with cadet info
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*, cadets(name_full, application_number, platoon)')
      .order('date_achieved', { ascending: true });
    if (error) throw error;
    let filtered = achievements || [];
    if (options) {
      if (options.type === 'cadet' && options.cadetId) {
        filtered = filtered.filter((a: any) => a.cadet_id === options.cadetId);
      } else if (options.type === 'platoon' && options.platoon) {
        if (options.platoon !== 'all') {
          filtered = filtered.filter((a: any) => a.cadets && a.cadets.platoon === options.platoon);
        }
      }
    }
    const rows: string[] = [];
    rows.push(['Cadet Name', 'App No', 'Platoon', 'Achievement Type', 'Description', 'Date Achieved', 'Camp/Event Name', 'Certificate No'].join(','));
    for (const a of filtered) {
      rows.push([
        `"${(a.cadets?.name_full || '').replace(/"/g,'""')}"`,
        a.cadets?.application_number || '',
        a.cadets?.platoon || '',
        a.achievement_type || '',
        `"${(a.achievement_description || '').replace(/"/g,'""')}"`,
        a.date_achieved || '',
        `"${(a.camp_name || '').replace(/"/g,'""')}"`,
        a.certificate_no || ''
      ].join(','));
    }
    const csvBlob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    let fileName = 'achievements-report-' + new Date().toISOString().split('T')[0] + '.csv';
    if (options) {
      if (options.type === 'cadet' && options.cadetId) {
        fileName = `achievements-cadet-${options.cadetId}-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (options.type === 'platoon' && options.platoon && options.platoon !== 'all') {
        fileName = `achievements-platoon-${options.platoon}-${new Date().toISOString().split('T')[0]}.csv`;
      }
    }
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    alert('Failed to download achievements report: ' + (error?.message || String(error)));
  }
};
// Achievements Report Dialog (reuses selection logic)
function AchievementsReportDialog() {
  const [open, setOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [downloadType, setDownloadType] = useState<'cadet'|'platoon'|null>(null);
  const [selectedCadetId, setSelectedCadetId] = useState<string>("");
  const [selectedPlatoon, setSelectedPlatoon] = useState<'all'|'Junior'|'Senior'>('all');
  const cadets = (window as any).cadets || [];
  const handleDownload = () => {
    setOpen(false);
    setSubDialogOpen(false);
    if (downloadType === 'cadet') {
      (downloadAchievementsReportCSV as any)({ type: 'cadet', cadetId: selectedCadetId });
    } else if (downloadType === 'platoon') {
      (downloadAchievementsReportCSV as any)({ type: 'platoon', platoon: selectedPlatoon });
    }
  };
  return (
    <>
      <Button className="w-full" variant="outline" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Generate Report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Achievements Report</DialogTitle>
            <DialogDescription>Download achievements by cadet or platoon.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button className="w-full" variant="secondary" onClick={() => { setOpen(false); setSubDialogOpen(true); }}>
              Download Achievements Report (CSV)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sub-dialog for achievements options */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Achievements Report</DialogTitle>
            <DialogDescription>Select how you want to download the report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-medium">Download Type:</label>
              <div className="flex gap-4 mt-2">
                <Button variant={downloadType==='cadet'?'default':'outline'} onClick={()=>setDownloadType('cadet')}>Cadet-based</Button>
                <Button variant={downloadType==='platoon'?'default':'outline'} onClick={()=>setDownloadType('platoon')}>Platoon-wise</Button>
              </div>
            </div>
            {downloadType==='cadet' && (
              <div>
                <label className="block mb-1">Select Cadet:</label>
                <select className="w-full border rounded px-2 py-1" value={selectedCadetId} onChange={e=>setSelectedCadetId(e.target.value)}>
                  <option value="">-- Select Cadet --</option>
                  {cadets.map((c:any) => (
                    <option key={c.id} value={c.id}>{c.name_full} ({c.application_number})</option>
                  ))}
                </select>
              </div>
            )}
            {downloadType==='platoon' && (
              <div>
                <label className="block mb-1">Select Platoon:</label>
                <select className="w-full border rounded px-2 py-1" value={selectedPlatoon} onChange={e=>setSelectedPlatoon(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={()=>setSubDialogOpen(false)}>Cancel</Button>
              <Button variant="default" disabled={downloadType==='cadet' && !selectedCadetId} onClick={handleDownload}>Download</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
      {/* Achievements Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Achievements Report</h3>
              <p className="text-sm text-muted-foreground">
                Achievements by cadet or platoon
              </p>
            </div>
            <AchievementsReportDialog />
          </div>
        </CardContent>
      </Card>



// TypeScript interface for Cadet
interface Cadet {
  id: string;
  name_full: string;
  name_with_initials: string;
  application_number: string;
  date_of_birth: string;
  platoon: string;
  rank: string;
  age: number;
  created_at: string;
  updated_at: string;
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AttendanceManagement from "@/components/AttendanceManagement";
import { useState, useEffect } from "react";
import CadetManagement from "@/components/CadetManagement";
import { Navigation } from "@/components/Navigation";
import { CadetRegistrationForm } from "@/components/CadetRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Shield, Edit, Trash2, FileText, Download, Calendar, Award, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Move ReportDialog to top-level, outside AdminDashboard
function ReportDialog({ generateReport, downloadAllSessionsAttendanceCSV, downloadAllTrainingAttendanceCSV }: {
  generateReport: (type: string) => void,
  downloadAllSessionsAttendanceCSV: () => void,
  downloadAllTrainingAttendanceCSV: () => void
}) {
  const [open, setOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [downloadType, setDownloadType] = useState<'cadet'|'platoon'|null>(null);
  const [selectedCadetId, setSelectedCadetId] = useState<string>("");
  const [selectedPlatoon, setSelectedPlatoon] = useState<'all'|'Junior'|'Senior'>('all');
  // Get cadets from parent scope (window.cadets fallback for now)
  const cadets = (window as any).cadets || [];

  const handleTrainingCampDownload = () => {
    setOpen(false);
    setSubDialogOpen(false);
    if (downloadType === 'cadet') {
      (downloadAllTrainingAttendanceCSV as any)({ type: 'cadet', cadetId: selectedCadetId });
    } else if (downloadType === 'platoon') {
      (downloadAllTrainingAttendanceCSV as any)({ type: 'platoon', platoon: selectedPlatoon });
    }
  };

  return (
    <>
      <Button className="w-full" variant="outline" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Generate Report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Report Type</DialogTitle>
            <DialogDescription>Choose which report to download.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button className="w-full" variant="secondary" onClick={() => { setOpen(false); generateReport('cadets'); }}>
              Cadet List (TXT)
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => { setOpen(false); downloadAllSessionsAttendanceCSV(); }}>
              Attendance: Practice Sessions (CSV)
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => { setOpen(false); setSubDialogOpen(true); }}>
              Attendance: Training Camps (CSV)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sub-dialog for training camp attendance options */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Training Camp Attendance</DialogTitle>
            <DialogDescription>Select how you want to download the report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-medium">Download Type:</label>
              <div className="flex gap-4 mt-2">
                <Button variant={downloadType==='cadet'?'default':'outline'} onClick={()=>setDownloadType('cadet')}>Cadet-based</Button>
                <Button variant={downloadType==='platoon'?'default':'outline'} onClick={()=>setDownloadType('platoon')}>Platoon-wise</Button>
              </div>
            </div>
            {downloadType==='cadet' && (
              <div>
                <label className="block mb-1">Select Cadet:</label>
                <select className="w-full border rounded px-2 py-1" value={selectedCadetId} onChange={e=>setSelectedCadetId(e.target.value)}>
                  <option value="">-- Select Cadet --</option>
                  {cadets.map((c:any) => (
                    <option key={c.id} value={c.id}>{c.name_full} ({c.application_number})</option>
                  ))}
                </select>
              </div>
            )}
            {downloadType==='platoon' && (
              <div>
                <label className="block mb-1">Select Platoon:</label>
                <select className="w-full border rounded px-2 py-1" value={selectedPlatoon} onChange={e=>setSelectedPlatoon(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={()=>setSubDialogOpen(false)}>Cancel</Button>
              <Button variant="default" disabled={downloadType==='cadet' && !selectedCadetId} onClick={handleTrainingCampDownload}>Download</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



// Extend jsPDF type for TypeScript

const AdminDashboard = () => {
  // Special events for selected cadet
  const [specialEvents, setSpecialEvents] = useState<any[]>([]);
  const [cadets, setCadets] = useState<Cadet[]>([]); // Move declaration up
  // Expose cadets to window for ReportDialog dropdown (quick workaround)
  useEffect(() => {
    (window as any).cadets = cadets;
  }, [cadets]);

  // Fetch special events for selected cadet
  const fetchSpecialEvents = async (cadetId: string) => {
    if (!cadetId) return setSpecialEvents([]);
    try {
      // Use the same fetch as CadetManagement: select all fields, order by duration_from (not created_at)
      const { data, error } = await supabase
        .from('special_events')
        .select('id, cadet_id, duration_from, duration_to, event_name, role_description, created_at')
        .eq('cadet_id', cadetId)
        .order('duration_from', { ascending: false });
      if (error) throw error;
      setSpecialEvents(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch special events: ' + error.message,
        variant: 'destructive',
      });
      setSpecialEvents([]);
    }
  };
  // Toast hook (must be before any toast usage)
  const { toast } = useToast();
  // Cadets state (must be before any cadets usage)
  // (cadets state already declared above)
  // Loading state (must be before any isLoading usage)
  const [isLoading, setIsLoading] = useState(false);
  // Pending cadets state
  const [pendingCadets, setPendingCadets] = useState<any[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  
  // Platoon selection dialog state
  const [showPlatoonDialog, setShowPlatoonDialog] = useState(false);
  const [selectedCadetForApproval, setSelectedCadetForApproval] = useState<any>(null);
  const [selectedPlatoonForApproval, setSelectedPlatoonForApproval] = useState<string>('');

  // Fetch pending cadets
  const fetchPendingCadets = async () => {
    setIsPendingLoading(true);
    try {
      const { data, error } = await supabase.from('pending_cadets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPendingCadets(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch pending cadets: ' + error.message, variant: 'destructive' });
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Approve pending cadet
  const handleApproveCadet = async (cadet: any) => {
    setSelectedCadetForApproval(cadet);
    setSelectedPlatoonForApproval('');
    setShowPlatoonDialog(true);
  };

  // New function to handle platoon selection and approval
  const handleConfirmApproval = async () => {
    if (!selectedCadetForApproval || !selectedPlatoonForApproval) {
      toast({
        title: "Error",
        description: "Please select a platoon",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCadetForApproval.auth_user_id) {
      toast({
        title: "Error",
        description: "This registration is missing auth information. Please ask the cadet to re-register.",
        variant: "destructive",
      });
      return;
    }

    setIsPendingLoading(true);
    try {
      // Step 1: Move to cadets table with platoon assignment
      const { data: inserted, error: insertError } = await supabase.from('cadets').insert({
        ...selectedCadetForApproval,
        // Remove fields not in cadets table
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        auth_user_id: undefined,
        // Set platoon (null if "none" selected)
        platoon: selectedPlatoonForApproval === 'none' ? null : selectedPlatoonForApproval,
        status: 'approved',
      }).select().single();
      if (insertError) throw insertError;

      // Step 2: Confirm auth account and link to cadet
      const { data: fnData, error: fnError } = await supabase.functions.invoke('confirm-cadet-account', {
        body: {
          authUserId: selectedCadetForApproval.auth_user_id,
          cadetId: inserted.id,
        },
      });

      if (fnError || !fnData?.success) {
        console.error('Account confirmation failed:', fnError || fnData);
        // Rollback: delete from cadets table
        await supabase.from('cadets').delete().eq('id', inserted.id);
        toast({
          title: 'Account confirmation failed',
          description: (fnError as any)?.message || (fnData as any)?.error || 'Could not confirm the cadet account.',
          variant: 'destructive',
        });
        setIsPendingLoading(false);
        return;
      }

      // Step 3: Remove from pending_cadets
      await supabase.from('pending_cadets').delete().eq('id', selectedCadetForApproval.id);
      
      toast({ 
        title: 'Approved', 
        description: `Cadet ${selectedCadetForApproval.name_full} approved! They can now login with their credentials.`
      });
      
      // Update UI immediately by removing from pending cadets list
      setPendingCadets(prev => prev.filter(c => c.id !== selectedCadetForApproval.id));
      
      // Refresh both lists to ensure consistency
      fetchPendingCadets();
      fetchCadets();
      setShowPlatoonDialog(false);
      setSelectedCadetForApproval(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Reject pending cadet
  const handleRejectCadet = async (cadet: any) => {
    setIsPendingLoading(true);
    try {
      await supabase.from('pending_cadets').delete().eq('id', cadet.id);
      toast({ title: 'Rejected', description: `Cadet ${cadet.name_full} rejected and removed.` });
      
      // Update UI immediately by removing from pending cadets list
      setPendingCadets(prev => prev.filter(c => c.id !== cadet.id));
      
      // Refresh the list to ensure consistency
      fetchPendingCadets();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Attendance Report Dialog states
  const [isAttendanceReportDialogOpen, setIsAttendanceReportDialogOpen] = useState(false);
  const [attendanceReportType, setAttendanceReportType] = useState('platoon');
  const [attendanceReportPlatoon, setAttendanceReportPlatoon] = useState('');
  const [attendanceReportCadet, setAttendanceReportCadet] = useState('');
  const [attendanceReportFrom, setAttendanceReportFrom] = useState('');
  const [attendanceReportTo, setAttendanceReportTo] = useState('');


  // Comprehensive Cadet PDF Report Dialog state
  const [isComprehensiveReportDialogOpen, setIsComprehensiveReportDialogOpen] = useState(false);
  const [selectedCadetIdForPDF, setSelectedCadetIdForPDF] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const openComprehensiveReportDialog = () => setIsComprehensiveReportDialogOpen(true);
  const closeComprehensiveReportDialog = () => {
    setIsComprehensiveReportDialogOpen(false);
    setSelectedCadetIdForPDF("");
    setIsGeneratingPDF(false);
  };

  // Fetch and aggregate all data for a comprehensive cadet report
  const fetchComprehensiveCadetData = async (cadetId: string) => {
    // Fetch main cadet info
    const { data: cadet, error: cadetError } = await supabase.from('cadets').select('*').eq('id', cadetId).single();
    if (cadetError) throw new Error('Failed to fetch cadet info: ' + cadetError.message);

    // Fetch promotions/demotions
    const { data: promotions, error: promoError } = await supabase.from('promotions').select('*').eq('cadet_id', cadetId).order('effective_date', { ascending: true });
    if (promoError) throw new Error('Failed to fetch promotions: ' + promoError.message);

  // Fetch achievements
  const { data: achievements, error: achError } = await supabase.from('achievements').select('*').eq('cadet_id', cadetId).order('date_achieved', { ascending: true });
  if (achError) throw new Error('Failed to fetch achievements: ' + achError.message);

    // Fetch performance
    const { data: performance, error: perfError } = await supabase.from('performance_evaluations').select('*').eq('cadet_id', cadetId).order('evaluation_date', { ascending: true });
    if (perfError) throw new Error('Failed to fetch performance: ' + perfError.message);

  // Fetch special events (renamed from special_projects)
  // Use the correct field name for ordering (e.g., 'duration_from')
  const { data: special_events, error: eventsError } = await supabase.from('special_events').select('*').eq('cadet_id', cadetId).order('duration_from', { ascending: true });
  if (eventsError) throw new Error('Failed to fetch special events: ' + eventsError.message);

    // Fetch foreign visits
    const { data: foreign_visits, error: foreignVisitsError } = await supabase.from('foreign_visits').select('*').eq('cadet_id', cadetId).order('duration_from', { ascending: true });
    if (foreignVisitsError) throw new Error('Failed to fetch foreign visits: ' + foreignVisitsError.message);

    // Return aggregated data
    return {
      ...cadet,
      promotions: promotions || [],
      achievements: achievements || [],
      performance: performance || [],
      special_projects: special_events || [],
      foreign_visits: foreign_visits || [],
    };
  };

  // Alternative: Generate and download PDF using pdf-lib
  const generateComprehensiveCadetPDF = async (cadetData: any, extraFields: any) => {
  // Dynamically import pdf-lib
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  // Debug: log cadetData to help diagnose missing fields
  // eslint-disable-next-line no-console
  console.log('generateComprehensiveCadetPDF cadetData:', cadetData);
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let y = height - 40;

  // Helper to check if y is too low and add a new page if needed
  function ensureSpace(spaceNeeded = 20) {
    if (y < 40 + spaceNeeded) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 40;
    }
  }

    // Title
    page.drawText('Comprehensive Cadet Report', {
      x: 40,
      y,
      size: 20,
      font,
      color: rgb(0.16, 0.5, 0.73),
    });
    y -= 30;
    ensureSpace(20);
    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 40,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Basic Info
    const basicInfo = [
      ['Cadet Name', cadetData.name_full || ''],
      ['Regiment Number', cadetData.application_number || ''],
      ['Platoon', cadetData.platoon || ''],
      ['Rank', cadetData.rank || ''],
      ['Date Joined', cadetData.date_joined || ''],
      ['Date Left', cadetData.date_left || ''],
    ];
    page.drawText('Basic Information:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
    y -= 20;
    basicInfo.forEach(([label, value]) => {
      ensureSpace(16);
      page.drawText(`${label}: ${value}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
      y -= 16;
    });
    y -= 10;

    // Promotions Table
    if (cadetData.promotions && cadetData.promotions.length > 0) {
      ensureSpace(18 + 14 + cadetData.promotions.length * 13 + 10);
      page.drawText('Promotions/Demotions:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
      y -= 18;
      page.drawText('Type | From Rank | To Rank | Effective Date', { x: 50, y, size: 11, font, color: rgb(0.2,0.2,0.2) });
      y -= 14;
      cadetData.promotions.forEach((p: any) => {
        ensureSpace(13);
        page.drawText(`${p.promotion_type} | ${p.from_rank} | ${p.to_rank} | ${p.effective_date}`, { x: 50, y, size: 10, font, color: rgb(0,0,0) });
        y -= 13;
      });
      y -= 10;
    }

    // Achievements Table (vertical fields)
    if (cadetData.achievements && cadetData.achievements.length > 0) {
      ensureSpace(18 + cadetData.achievements.length * (8 + 14 * 5) + 10);
      page.drawText('Achievements:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
      y -= 18;
      cadetData.achievements.forEach((a: any, idx: number) => {
        if (idx > 0) { y -= 8; }
        ensureSpace(14 * 5);
        page.drawText(`Achievement Type: ${a.achievement_type || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Date Achieved: ${a.date_achieved || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Description: ${a.achievement_description || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Camp/Event Name: ${a.camp_name || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Certificate Number: ${a.certificate_no || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
      });
      y -= 10;
    }

    // Performance Table (all fields, always show section)
    page.drawText('Performance:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
    y -= 18;
    if (cadetData.performance && cadetData.performance.length > 0) {
      // Dynamically get all unique keys from all performance records, excluding 'id' and 'cadet_id'
      const perfKeysSet = new Set<string>();
      cadetData.performance.forEach((p: any) => Object.keys(p).forEach(k => {
        if (k !== 'id' && k !== 'cadet_id' && k !== 'created_at') perfKeysSet.add(k);
      }));
      let perfKeys = Array.from(perfKeysSet);
      const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);
      const tableX = 50;
      const tableWidth = 400;
      const minColWidth = 80;
      const maxCols = Math.floor(tableWidth / minColWidth);
      // Add 'Total' as the last column
      perfKeys = [...perfKeys, 'Total'];
      for (let colStart = 0; colStart < perfKeys.length; colStart += maxCols) {
        const colKeys = perfKeys.slice(colStart, colStart + maxCols);
        const colWidth = tableWidth / colKeys.length;
        // Draw header row
        let headerY = y;
        const headerCellHeight = 12;
        ensureSpace(headerCellHeight);
        for (let i = 0; i < colKeys.length; i++) {
          const x = tableX + i * colWidth;
          // Draw cell rectangle (header)
          page.drawRectangle({ x, y: headerY - headerCellHeight, width: colWidth, height: headerCellHeight, borderColor: rgb(0.7,0.7,0.7), borderWidth: 0.5 });
          // Center header text (vertically and horizontally)
          let header = colKeys[i];
          if (header === 'Total') header = 'Total';
          else header = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const textWidth = monoFont.widthOfTextAtSize(header, 8);
          const textHeight = 8; // font size
          page.drawText(header, {
            x: x + (colWidth - textWidth) / 2,
            y: headerY - headerCellHeight / 2 - textHeight / 2 + 2,
            size: 8,
            font: monoFont,
            color: rgb(0.2,0.2,0.2)
          });
        }
        y -= headerCellHeight;
        // Data rows
        const dataCellHeight = 10;
        cadetData.performance.forEach((p: any) => {
          ensureSpace(dataCellHeight);
          for (let i = 0; i < colKeys.length; i++) {
            const x = tableX + i * colWidth;
            // Draw cell rectangle (data)
            page.drawRectangle({ x, y: y - dataCellHeight, width: colWidth, height: dataCellHeight, borderColor: rgb(0.85,0.85,0.85), borderWidth: 0.5 });
            // Center data text (vertically and horizontally)
            let value = '';
            if (colKeys[i] === 'Total') {
              // Sum all numeric values (including numeric strings) for the displayed columns except 'Total'
              value = perfKeys
                .filter(k => k !== 'Total')
                .reduce((sum, k) => {
                  const v = p[k];
                  const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : 0);
                  return sum + (isFinite(n) ? n : 0);
                }, 0)
                .toString();
            } else {
              value = String(p[colKeys[i]] ?? '');
            }
            const textWidth = monoFont.widthOfTextAtSize(value, 7);
            const textHeight = 7; // font size
            page.drawText(value, {
              x: x + (colWidth - textWidth) / 2,
              y: y - dataCellHeight / 2 - textHeight / 2 + 2,
              size: 7,
              font: monoFont,
              color: rgb(0,0,0)
            });
          }
          y -= dataCellHeight;
        });
        // Only add extra space after the last chunk of columns
        if (colStart + maxCols >= perfKeys.length) {
          y -= 36; // Large gap only after the last table row
        } else {
          y -= 6; // Small gap between table lines
        }
      }
    } else {
      ensureSpace(14);
      page.drawText('No performance records available.', { x: 50, y, size: 10, font, color: rgb(0.5,0.5,0.5) });
      y -= 14;
    }

    // Special Projects Table (Special Events - show all fields, robustly)
    if (cadetData.special_projects && cadetData.special_projects.length > 0) {
      ensureSpace(18 + cadetData.special_projects.length * (8 + 14 * 4) + 10);
      page.drawText('Special Events:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
      y -= 18;
      cadetData.special_projects.forEach((p: any, idx: number) => {
        if (idx > 0) { y -= 8; }
        ensureSpace(14 * 4);
        page.drawText(`Event Name: ${p.event_name || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Role Description: ${p.role_description || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Duration From: ${p.duration_from || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Duration To: ${p.duration_to || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
      });
      y -= 10;
    }

    // Foreign Visits Table (show all fields, robustly)
    if (cadetData.foreign_visits && cadetData.foreign_visits.length > 0) {
      ensureSpace(18 + cadetData.foreign_visits.length * (8 + 14 * 5) + 10);
      page.drawText('Foreign Visits:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
      y -= 18;
      cadetData.foreign_visits.forEach((visit: any, idx: number) => {
        if (idx > 0) { y -= 8; }
        ensureSpace(14 * 5);
        page.drawText(`Country: ${visit.country || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Event Name: ${visit.event_name || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Duration From: ${visit.duration_from || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Duration To: ${visit.duration_to || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
        page.drawText(`Remarks: ${visit.remarks || ''}`, { x: 50, y, size: 11, font, color: rgb(0,0,0) });
        y -= 14;
      });
      y -= 10;
    }

    // Additional Fields (from UI prompt)
    if (extraFields) {
      page.drawText('Additional Information:', { x: 40, y, size: 14, font, color: rgb(0,0,0) });
      y -= 30;
      Object.entries(extraFields).forEach(([k, v]) => {
        page.drawText(`${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`, { x: 50, y, size: 10, font, color: rgb(0,0,0) });
        y -= 13;
      });
      y -= 10;
    }

    // Download
  const pdfBytes = await pdfDoc.save();
  // Ensure pdfBytes is a plain Uint8Array with a compatible ArrayBuffer
  const blob = new Blob([pdfBytes instanceof Uint8Array ? pdfBytes.slice() : pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cadet-report-${cadetData.application_number || 'unknown'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
  };

  // Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Handler for attendance report download
  const handleDownloadAttendanceReport = async () => {
    // Download attendance report using same logic as CadetManagement
    // Fetch all practice sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('practice_sessions')
      .select('*');
    if (sessionError) {
      toast({ title: 'Error', description: 'Failed to fetch practice sessions: ' + sessionError.message, variant: 'destructive' });
      return;
    }
    // Filter sessions by date range if provided
    let filteredSessions = sessions || [];
    if (attendanceReportFrom && attendanceReportTo) {
      filteredSessions = filteredSessions.filter(s => {
        const date = new Date(s.practice_date);
        return date >= new Date(attendanceReportFrom) && date <= new Date(attendanceReportTo);
      });
    }
    // Aggregate attendance records from all sessions
    let allRecords = [];
    for (const session of filteredSessions) {
      const { data: attData, error: attErr } = await supabase.rpc('get_attendance_report', { session_id: session.id });
      if (!attErr && attData) {
        attData.forEach((r: any) => {
          allRecords.push({ ...r, session });
        });
      }
    }
    // Filter by platoon/cadet if needed
    if (attendanceReportType === 'platoon' && attendanceReportPlatoon !== 'All' && attendanceReportPlatoon) {
      allRecords = allRecords.filter(r => r.platoon === attendanceReportPlatoon);
    }
    if (attendanceReportType === 'cadet' && attendanceReportCadet) {
      allRecords = allRecords.filter(r => r.cadet_id === attendanceReportCadet);
    }
    // Generate CSV
    let csvRows = [
      ['Regiment No.', 'Name', 'Platoon', 'Session Date', 'Session Title', 'Duration (min)', 'Attendance %', 'Status'].join(',')
    ];
    if (allRecords.length === 0) {
      csvRows.push(['N/A','N/A','N/A','N/A','N/A','N/A','N/A','N/A'].join(','));
    } else {
      allRecords.forEach(r => {
        // Calculate duration (min) from entry/exit time
        let durationMin = '';
        if (r.entry_time && r.exit_time) {
          const [sh, sm] = String(r.entry_time).split(':').map(Number);
          const [eh, em] = String(r.exit_time).split(':').map(Number);
          const minutes = (eh * 60 + em) - (sh * 60 + sm);
          durationMin = String(minutes > 0 ? minutes : 0);
        } else {
          durationMin = '0';
        }
        // Calculate attendance %
        let attendancePct = '';
        const sessionDuration = r.session.duration_minutes || 0;
        if (sessionDuration > 0) {
          attendancePct = ((Number(durationMin) / sessionDuration) * 100).toFixed(1);
        } else {
          attendancePct = '0';
        }
        // Calculate status
        let status = '';
        const pctNum = Number(attendancePct);
        if (pctNum >= 80) {
          status = 'present';
        } else if (pctNum >= 20) {
          status = 'early_departure';
        } else {
          status = 'absent';
        }
        csvRows.push([
          String(r.application_number || ''),
          String(r.cadet_name || ''),
          String(r.platoon || ''),
          String(r.session.practice_date || ''),
          String(r.session.title || ''),
          String(durationMin),
          String(attendancePct),
          String(status)
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
      });
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    setIsAttendanceReportDialogOpen(false);
  };

  // Fetch attendance records for all cadets
  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*');
      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance records: ' + error.message,
        variant: 'destructive',
      });
    }
  };
  // Restore handleEditCadet
  const handleEditCadet = async () => {
    if (!selectedCadet) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cadets')
        .update(editCadet)
        .eq('id', selectedCadet.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Cadet information updated successfully",
      });
      setIsEditDialogOpen(false);
      fetchCadets();
      fetchSpecialEvents(selectedCadet.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update cadet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Restore handleDeleteCadet
  const handleDeleteCadet = async (cadetId: string) => {
    if (!confirm("Are you sure you want to delete this cadet? This action cannot be undone.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('cadets')
        .delete()
        .eq('id', cadetId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Cadet deleted successfully",
      });
      fetchCadets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cadet",
        variant: "destructive",
      });
    }
  };

  // (removed duplicate isLoading declaration)
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCadets: 0,
    juniorPlatoon: 0,
    seniorPlatoon: 0,
    recentJoins: 0
  });

  // Promotion form state
  const [newRecord, setNewRecord] = useState<{
    to_rank?: string;
    effective_date?: string;
    promotion_type?: string;
  }>({});

  // Excuse letters state
  const [excuseLetters, setExcuseLetters] = useState<{ [cadetId: string]: any[] }>({});

  // Stub for fetchCadetRecords (if needed for UI refresh after promotion)
  const fetchCadetRecords = async () => {
    await fetchCadets();
    await fetchExcuseLetters();
    if (selectedCadet && selectedCadet.id) {
      await fetchSpecialEvents(selectedCadet.id);
    }
  };

  // Delete practice session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this practice session? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Practice session deleted successfully",
      });
      // Optionally refresh session list if you have it
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete practice session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [editCadet, setEditCadet] = useState<Partial<Cadet>>({});

  useEffect(() => {
    fetchCadets();
    fetchExcuseLetters();
    fetchAttendanceRecords();
    fetchPendingCadets();
  }, []);

  // Fetch special events when selectedCadet changes
  useEffect(() => {
    if (selectedCadet && selectedCadet.id) {
      fetchSpecialEvents(selectedCadet.id);
    } else {
      setSpecialEvents([]);
    }
  }, [selectedCadet]);

  // Main dashboard return


  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCadets(data || []);
      // Calculate stats
      const total = data?.length || 0;
      const junior = data?.filter(c => c.platoon === 'Junior').length || 0;
      const senior = data?.filter(c => c.platoon === 'Senior').length || 0;
      const recent = data?.filter(c => {
        const createdDate = new Date(c.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length || 0;

      setStats({
        totalCadets: total,
        juniorPlatoon: junior,
        seniorPlatoon: senior,
        recentJoins: recent
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadets: " + error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch all excuse letters and group by cadet_id
  const fetchExcuseLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('excuse_letters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Group by cadet_id
      const grouped: { [cadetId: string]: any[] } = {};
      (data || []).forEach((letter: any) => {
        if (!grouped[letter.cadet_id]) grouped[letter.cadet_id] = [];
        grouped[letter.cadet_id].push(letter);
      });
      setExcuseLetters(grouped);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch excuse letters: " + error.message,
        variant: "destructive",
      });
    }
  };

  const generateReport = async (type: string) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      switch (type) {
        case 'cadets':
          // Generate CSV
          let csvRows = [
            ['Name', 'App No', 'Platoon', 'Rank', 'Age'].join(',')
          ];
          cadets.forEach(cadet => {
            csvRows.push([
          String(cadet.name_full),
          String(cadet.application_number),
          String(cadet.platoon || ''),
          String(cadet.rank || 'Cadet'),
          String(cadet.age || '')
            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
          });
          const csvBlobCadet = new Blob([csvRows.join('\n')], { type: 'text/csv' });
          const urlCadet = window.URL.createObjectURL(csvBlobCadet);
          const aCadet = document.createElement('a');
          aCadet.href = urlCadet;
          aCadet.download = `cadet-report-${timestamp}.csv`;
          document.body.appendChild(aCadet);
          aCadet.click();
          document.body.removeChild(aCadet);
          window.URL.revokeObjectURL(urlCadet);
          toast({
            title: "Success",
            description: "Cadet report CSV downloaded successfully",
          });
          return;

        case 'attendance':
          // No longer using reportData, skip this case
          return;
        case 'performance':
          // CSV header
          let csvRowsPerf: string[] = [];
          csvRowsPerf.push([
            'Date',
            'Cadet Name',
            'Squad Drill',
            'Physical Training',
            'Assual',
            'Drama',
            'Presentation',
            'Regimental Duties',
            'NCC Knowledge',
            'First Aid',
            'Actions'
          ].join(','));
          try {
            // Fetch all performance records and join with cadet name
            const { data: perfData, error: perfErr } = await supabase
              .from('performance_evaluations')
              .select('*, cadets(name_full)')
              .order('evaluation_date', { ascending: false });
            if (perfErr) throw perfErr;
            (perfData || []).forEach((rec: any) => {
              csvRowsPerf.push([
                rec.evaluation_date || '',
                rec.cadets?.name_full || '',
                rec.squad_drill || '',
                rec.physical_training || '',
                rec.assual || '',
                rec.drama || '',
                rec.presentation || '',
                rec.regimental_duties || '',
                rec.ncc_knowledge || '',
                rec.first_aid || '',
                rec.actions || ''
              ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
            });
          } catch (err: any) {
            csvRowsPerf.push(`Error fetching performance records: ${err.message}`);
          }
          // Download as CSV
          const csvBlobPerf = new Blob([csvRowsPerf.join('\n')], { type: 'text/csv' });
          const urlPerf = window.URL.createObjectURL(csvBlobPerf);
          const aPerf = document.createElement('a');
          aPerf.href = urlPerf;
          aPerf.download = `performance-report-${timestamp}.csv`;
          document.body.appendChild(aPerf);
          aPerf.click();
          document.body.removeChild(aPerf);
          window.URL.revokeObjectURL(urlPerf);
          toast({
            title: 'Success',
            description: 'Performance report CSV downloaded',
          });
          return;
          return;
      }

      // Removed unused reportData download logic
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  // New: export attendance for all cadets across all practice sessions as CSV
  const downloadAllSessionsAttendanceCSV = async () => {
    try {
      setIsLoading(true);
      // Fetch all practice sessions
      const { data: sessionsData, error: sessErr } = await supabase.from('practice_sessions').select('*').order('practice_date', { ascending: true });
      if (sessErr) throw sessErr;

      // For each session, call RPC get_attendance_report if available, otherwise query attendance_records
      const rows: string[] = [];
      // CSV header
            rows.push(['Camp Name,Level,Location,Duration From,Duration To,Cadet Name,Application Number,Platoon,Remarks'].join(','));

      for (const session of (sessionsData || [])) {
        // try RPC
        const { data: attData, error: attErr } = await supabase.rpc('get_attendance_report', { session_id: session.id });
        let records: any[] = [];
        if (!attErr && attData) records = attData as any[];
        else {
          // fallback: try attendance_records table with session_id
          const { data: fallback, error: fbErr } = await supabase.from('attendance_records').select('*').eq('session_id', session.id);
          if (fbErr) throw fbErr;
          records = fallback || [];
        }

        for (const r of records) {
          // compute participation minutes and percentage if possible
          let participation_minutes = '';
          let attendance_percentage = '';
          try {
            if (r.entry_time && r.exit_time && session.duration_minutes) {
              const [eh, em] = r.exit_time.split(':').map(Number);
              const [sh, sm] = r.entry_time.split(':').map(Number);
              const pm = (eh * 60 + em) - (sh * 60 + sm);
              participation_minutes = String(pm < 0 ? 0 : pm);
              attendance_percentage = ((pm / session.duration_minutes) * 100).toFixed(1);
            }
          } catch (e) {
            // ignore
          }

          rows.push([
            session.id,
            `"${(session.title || '').replace(/"/g,'""')}"`,
            session.practice_date,
            r.application_number || r.cadet_app_no || '',
            `"${(r.cadet_name || '').replace(/"/g,'""')}"`,
            r.platoon || '',
            r.entry_time || '',
            r.exit_time || '',
            participation_minutes,
            attendance_percentage
          ].join(','));
        }
      }

      const csvBlob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-all-sessions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'All sessions attendance CSV downloaded' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to download sessions attendance: ' + (error?.message || String(error)), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

    {/* Example: Add this to your session list/table rendering in AdminDashboard */}
    {/*
    {sessions.map(session => (
      <div key={session.id}>
        <span>{session.title}</span>
        <Button variant="destructive" onClick={() => handleDeleteSession(session.id)} disabled={isLoading}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
    ))}
    */}
  // New: export attendance for all cadets across all training camps as CSV
  // Accepts options: { type: 'cadet', cadetId } or { type: 'platoon', platoon }
  const downloadAllTrainingAttendanceCSV = async (options?: { type: 'cadet', cadetId: string } | { type: 'platoon', platoon: string }) => {
    try {
      setIsLoading(true);
      // Get all training camps from the training_camps table
      const { data: camps, error: campsErr } = await supabase
        .from('training_camps')
        .select(`
          *,
          cadets!training_camps_cadet_id_fkey (
            name_full,
            application_number,
            platoon
          )
        `)
        .order('duration_from', { ascending: true });
      if (campsErr) throw campsErr;

      let filteredCamps = camps || [];
      if (options) {
        if (options.type === 'cadet' && options.cadetId) {
          filteredCamps = filteredCamps.filter((camp: any) => camp.cadet_id === options.cadetId);
        } else if (options.type === 'platoon' && options.platoon) {
          if (options.platoon !== 'all') {
            filteredCamps = filteredCamps.filter((camp: any) => camp.cadets && camp.cadets.platoon === options.platoon);
          }
        }
      }

      const rows: string[] = [];
      // Updated CSV header to match training camps structure
      rows.push(['Camp Name', 'Level', 'Location', 'Duration From', 'Duration To', 'Cadet Name', 'Application Number', 'Platoon', 'Remarks'].join(','));

      for (const camp of filteredCamps) {
        rows.push([
          `"${(camp.camp_name || '').replace(/"/g,'""')}"`,
          camp.camp_level || '',
          `"${(camp.location || '').replace(/"/g,'""')}"`,
          camp.duration_from || '',
          camp.duration_to || '',
          `"${((camp.cadets && camp.cadets.name_full) ? camp.cadets.name_full : 'No Cadet Assigned').replace(/"/g,'""')}"`,
          (camp.cadets && camp.cadets.application_number) ? camp.cadets.application_number : 'N/A',
          (camp.cadets && camp.cadets.platoon) ? camp.cadets.platoon : 'N/A',
          `"${(camp.remarks || '').replace(/"/g,'""')}"`
        ].join(','));
      }

      const csvBlob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      let fileName = 'training-attendance-all-camps-' + new Date().toISOString().split('T')[0] + '.csv';
      if (options) {
        if (options.type === 'cadet' && options.cadetId) {
          fileName = `training-attendance-cadet-${options.cadetId}-${new Date().toISOString().split('T')[0]}.csv`;
        } else if (options.type === 'platoon' && options.platoon && options.platoon !== 'all') {
          fileName = `training-attendance-platoon-${options.platoon}-${new Date().toISOString().split('T')[0]}.csv`;
        }
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'Training camps attendance CSV downloaded' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to download training attendance: ' + (error?.message || String(error)), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 pt-6 pb-6 sm:pt-10 sm:pb-10 flex flex-col items-center sm:items-start max-w-full sm:max-w-fit mx-auto w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center sm:text-left">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-3 text-center sm:text-left">
            Manage cadet accounts and information
          </p>
        </div>

        {/* Pending Cadets Approval Section */}
        <div className="mb-10 w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Pending Cadet Approvals
              </CardTitle>
              <CardDescription>
                Review and approve or reject new cadet registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPendingLoading ? (
                <div className="text-center py-6">Loading pending cadets...</div>
              ) : pendingCadets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No pending cadet registrations.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Dynamically render all keys as columns, except id, created_at, updated_at, and excluded fields */}
                        {pendingCadets.length > 0 && Object.keys(pendingCadets[0])
                          .filter(key => ![
                            'id','created_at','updated_at',
                            'date_joined_practices','date_left_practices','withdrawal_letter_type','withdrawal_date_from','withdrawal_date_to','withdrawal_reason','withdrawal_approved','battalion_informed','battalion_acceptance','battalion_acceptance_date','master_remarks','rector_recommendations'
                          ].includes(key))
                          .map((key) => (
                            <TableHead key={key} className="whitespace-nowrap">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableHead>
                        ))}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCadets.map((cadet) => (
                        <TableRow key={cadet.id}>
                          {/* Render all fields dynamically except id, created_at, updated_at */}
                          {Object.keys(cadet)
                            .filter(key => ![
                              'id','created_at','updated_at',
                              'date_joined_practices','date_left_practices','withdrawal_letter_type','withdrawal_date_from','withdrawal_date_to','withdrawal_reason','withdrawal_approved','battalion_informed','battalion_acceptance','battalion_acceptance_date','master_remarks','rector_recommendations'
                            ].includes(key))
                            .map((key) => (
                              <TableCell key={key} className="whitespace-nowrap max-w-xs truncate">
                                {/* Special handling for file/image fields if needed */}
                                {typeof cadet[key] === 'string' && cadet[key]?.startsWith('http') && (cadet[key].endsWith('.jpg') || cadet[key].endsWith('.png') || cadet[key].endsWith('.jpeg')) ? (
                                  <img src={cadet[key]} alt={key} className="h-10 w-10 object-cover rounded" />
                                ) : String(cadet[key])}
                              </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" onClick={() => handleApproveCadet(cadet)} disabled={isPendingLoading}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectCadet(cadet)} disabled={isPendingLoading}>
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cadets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCadets}</div>
              <p className="text-xs text-muted-foreground">Active cadet records</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Junior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.juniorPlatoon}</div>
              <p className="text-xs text-muted-foreground">Ages 12-14</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seniorPlatoon}</div>
              <p className="text-xs text-muted-foreground">Ages 14-20</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Joins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentJoins}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

  <div className="h-12 sm:h-16 lg:h-20" />
  <Tabs defaultValue="create-account" className="w-full mt-6">
          <div className="w-full mb-20 flex flex-col items-center">
            <div className="relative w-full">
              <div className="absolute left-0 top-0 w-full h-full bg-muted rounded-lg" />
              <TabsList
                className="flex flex-col w-full items-center justify-center min-h-[260px] sm:min-h-[60px] sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2 relative"
                style={{ width: '100%' }}
              >
                <TabsTrigger value="create-account" className="block w-full sm:w-auto px-4 py-3 text-center">Create Cadet Account</TabsTrigger>
                <TabsTrigger value="attendance" className="block w-full sm:w-auto px-4 py-3 text-center">Attendance Management</TabsTrigger>
                <TabsTrigger value="manage-cadets" className="block w-full sm:w-auto px-4 py-3 text-center">Basic Cadet Management</TabsTrigger>
                <TabsTrigger value="cadet-records" className="block w-full sm:w-auto px-4 py-3 text-center">Cadet Records Management</TabsTrigger>
                <TabsTrigger value="reports" className="block w-full sm:w-auto px-4 py-3 text-center">Reports</TabsTrigger>
              </TabsList>
            </div>
          </div>

          
            <TabsContent value="create-account">
              <div className="mb-8 mt-28 sm:mt-12">
                <CadetRegistrationForm onSuccess={fetchCadets} />
              </div>
            </TabsContent>

          <TabsContent value="attendance">
            <div className="mb-8 mt-16 sm:mt-0">
              <AttendanceManagement />
              {/* Excuse Letters Section for Admins */}
              <div className="mt-10">
                <h3 className="text-lg font-semibold mb-4">Submitted Excuse Letters</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cadet Name</TableHead>
                        <TableHead>App No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(excuseLetters).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">No excuse letters submitted.</TableCell>
                        </TableRow>
                      )}
                      {Object.entries(excuseLetters).map(([cadetId, letters]) => (
                        letters.map((letter, idx) => {
                          const cadet = cadets.find(c => c.id === cadetId);
                          return (
                            <TableRow key={letter.id || idx}>
                              <TableCell>{cadet ? cadet.name_full : 'Unknown'}</TableCell>
                              <TableCell>{cadet ? cadet.application_number : 'Unknown'}</TableCell>
                              <TableCell>{new Date(letter.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{letter.reason}</TableCell>
                              <TableCell>
                                <Badge variant={letter.status === 'approved' ? 'default' : letter.status === 'pending' ? 'secondary' : 'destructive'}>
                                  {letter.status ? letter.status.charAt(0).toUpperCase() + letter.status.slice(1) : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manage-cadets">
            <Card className="mb-8 mt-16 sm:mt-0">
              <CardHeader className="pb-4">
                <CardTitle>Basic Cadet Management</CardTitle>
                <CardDescription>View and manage basic cadet information</CardDescription>
              </CardHeader>
               {/* Promotions Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cadet Promotions
          </CardTitle>
          <CardDescription>
            Select a cadet and give a promotion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto mb-4">
            {cadets.map((cadet) => (
              <Card
                key={cadet.id}
                className={`cursor-pointer transition-colors ${selectedCadet?.id === cadet.id ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedCadet(cadet)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{cadet.name_full}</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>App No: {cadet.application_number}</p>
                      <p>{cadet.platoon} - {cadet.rank || 'Cadet'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedCadet && (
            <>
              <div className="border rounded-lg p-4 bg-muted">
                <h3 className="font-semibold mb-2">Promote: {selectedCadet.name_full}</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setIsLoading(true);
                      // Insert promotion record
                      const { error: promoError } = await supabase
                        .from('promotions')
                        .insert({
                          cadet_id: selectedCadet.id,
                          from_rank: selectedCadet.rank,
                          to_rank: newRecord.to_rank,
                          effective_date: newRecord.effective_date,
                          promotion_type: newRecord.promotion_type,
                        });
                      if (promoError) throw promoError;

                      // Update cadet's current rank
                      const { error: rankError } = await supabase
                        .from('cadets')
                        .update({ rank: newRecord.to_rank })
                        .eq('id', selectedCadet.id);
                      if (rankError) throw rankError;

                      // Update selectedCadet in UI immediately
                      setSelectedCadet({ ...selectedCadet, rank: newRecord.to_rank });

                      toast({ title: 'Success', description: 'Promotion added and rank updated.' });
                      setNewRecord({});
                      fetchCadetRecords();
                      fetchSpecialEvents(selectedCadet.id);
                    } catch (error: any) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Current Rank</Label>
                      <Input value={selectedCadet.rank || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>New Rank</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={newRecord.to_rank || ''}
                        onChange={e => setNewRecord({ ...newRecord, to_rank: e.target.value })}
                        required
                      >
                        <option value="">Select rank</option>
                        <option value="Cadet">Cadet</option>
                        <option value="Lance Corporal">Lance Corporal</option>
                        <option value="Corporal">Corporal</option>
                        <option value="Sergeant">Sergeant</option>
                        <option value="Staff Sergeant">Staff Sergeant</option>
                        <option value="Warrant Officer">Warrant Officer</option>
                        <option value="Warrant Officer II">Warrant Officer II</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Effective Date</Label>
                      <Input
                        type="date"
                        value={newRecord.effective_date || ''}
                        onChange={e => setNewRecord({ ...newRecord, effective_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Promotion Type</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={newRecord.promotion_type || ''}
                        onChange={e => setNewRecord({ ...newRecord, promotion_type: e.target.value })}
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Demotion">Demotion</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="mt-2">Give Promotion</Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold">Cadet List ({cadets.length})</h3>
                    <Button onClick={fetchCadets} variant="outline">
                      Refresh
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>App No.</TableHead>
                          <TableHead>Platoon</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cadets.map((cadet) => (
                          <TableRow key={cadet.id}>
                            <TableCell className="font-medium whitespace-nowrap">{cadet.name_full}</TableCell>
                            <TableCell className="whitespace-nowrap">{cadet.application_number}</TableCell>
                            <TableCell>
                              <Badge variant={cadet.platoon === 'Junior' ? 'secondary' : 'default'}>
                                {cadet.platoon}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{cadet.rank || 'Cadet'}</TableCell>
                            <TableCell>{cadet.age || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCadet(cadet);
                                        setEditCadet(cadet);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Cadet Information</DialogTitle>
                                      <DialogDescription>
                                        Update cadet details below
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Full Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={editCadet.name_full || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, name_full: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-initials">Name with Initials</Label>
                                        <Input
                                          id="edit-initials"
                                          value={editCadet.name_with_initials || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, name_with_initials: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-platoon">Platoon</Label>
                                        <select
                                          id="edit-platoon"
                                          value={editCadet.platoon || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, platoon: e.target.value })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          <option value="Junior">Junior</option>
                                          <option value="Senior">Senior</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-rank">Rank</Label>
                                        <select
                                          id="edit-rank"
                                          value={editCadet.rank || 'Cadet'}
                                          onChange={(e) => setEditCadet({ ...editCadet, rank: e.target.value })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          <option value="Cadet">Cadet</option>
                                          <option value="Lance Corporal">Lance Corporal</option>
                                          <option value="Corporal">Corporal</option>
                                          <option value="Sergeant">Sergeant</option>
                                          <option value="Staff Sergeant">Staff Sergeant</option>
                                          <option value="Warrant Officer">Warrant Officer</option>
                                          <option value="Under Officer">Warrant Officer II</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-4">
                                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleEditCadet} disabled={isLoading}>
                                        {isLoading ? "Updating..." : "Update"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCadet(cadet.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cadet-records">
            <div className="mt-16 sm:mt-0">
              <CadetManagement />
            </div>
          </TabsContent>

          <TabsContent value="reports">
  <div className="mt-16 sm:mt-0">
    <div className="mb-8">
      <h2 className="text-xl font-bold">Reports</h2>
      <p className="text-muted-foreground">Generate various reports and analytics</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cadet Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Cadet Report</h3>
              <p className="text-sm text-muted-foreground">
                Complete list of all cadets with basic information
              </p>
            </div>
            <ReportDialog 
              generateReport={generateReport} 
              downloadAllSessionsAttendanceCSV={downloadAllSessionsAttendanceCSV} 
              downloadAllTrainingAttendanceCSV={downloadAllTrainingAttendanceCSV} 
            />
          </div>
        </CardContent>
      </Card>
      {/* Achievements Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Achievements Report</h3>
              <p className="text-sm text-muted-foreground">
                Achievements by cadet or platoon
              </p>
            </div>
            <AchievementsReportDialog />
          </div>
        </CardContent>
      </Card>
      {/* Comprehensive Cadet PDF Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Comprehensive Cadet PDF Report</h3>
              <p className="text-sm text-muted-foreground">
                All details, performance, achievements, and extra fields in a single PDF
              </p>
            </div>
            <Button variant="outline" onClick={openComprehensiveReportDialog}>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
            <Dialog open={isComprehensiveReportDialogOpen} onOpenChange={setIsComprehensiveReportDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Comprehensive Cadet PDF Report</DialogTitle>
                  <DialogDescription>
                    Select a cadet and any extra fields to include in the PDF report.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4">
                  <Label>Select Cadet</Label>
                  <select
                    className="w-full mt-2 p-2 border rounded"
                    value={selectedCadetIdForPDF}
                    onChange={e => setSelectedCadetIdForPDF(e.target.value)}
                  >
                    <option value="">-- Select Cadet --</option>
                    {cadets.map(cadet => (
                      <option key={cadet.id} value={cadet.id}>{cadet.name_full}</option>
                    ))}
                  </select>
                </div>
                {/* You can add extra fields here if needed */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeComprehensiveReportDialog} disabled={isGeneratingPDF}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      if (!selectedCadetIdForPDF) return;
                      setIsGeneratingPDF(true);
                      try {
                        const cadetData = await fetchComprehensiveCadetData(selectedCadetIdForPDF);
                        await generateComprehensiveCadetPDF(cadetData, {});
                        toast({ title: 'Success', description: 'PDF generated and downloaded.' });
                        closeComprehensiveReportDialog();
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.message || 'Failed to generate PDF', variant: 'destructive' });
                        setIsGeneratingPDF(false);
                      }
                    }}
                    disabled={!selectedCadetIdForPDF || isGeneratingPDF}
                  >
                    {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      {/* Attendance Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Attendance Report</h3>
              <p className="text-sm text-muted-foreground">
                Attendance statistics and records
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsAttendanceReportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            {/* Attendance Report Dialog (single instance) */}
            <Dialog open={isAttendanceReportDialogOpen} onOpenChange={setIsAttendanceReportDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Download Attendance Report</DialogTitle>
                  <DialogDescription>
                    Select report type and filter options.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4">
                  <Label>Report Type</Label>
                  <div className="flex gap-4 mt-2">
                    <Button variant={attendanceReportType === "platoon" ? "default" : "outline"} onClick={() => setAttendanceReportType("platoon")}>Platoon</Button>
                    <Button variant={attendanceReportType === "cadet" ? "default" : "outline"} onClick={() => setAttendanceReportType("cadet")}>Cadet</Button>
                  </div>
                </div>
                {attendanceReportType === "platoon" && (
                  <div className="mb-4">
                    <Label>Select Platoon</Label>
                    <select className="w-full mt-2 p-2 border rounded" value={attendanceReportPlatoon} onChange={e => setAttendanceReportPlatoon(e.target.value)}>
                      <option value="">-- Select Platoon --</option>
                      <option value="All">All</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                )}
                {attendanceReportType === "cadet" && (
                  <div className="mb-4">
                    <Label>Select Cadet</Label>
                    <select className="w-full mt-2 p-2 border rounded" value={attendanceReportCadet} onChange={e => setAttendanceReportCadet(e.target.value)}>
                      <option value="">-- Select Cadet --</option>
                      {cadets.map(cadet => (
                        <option key={cadet.id} value={cadet.id}>{cadet.name_full}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>From Date</Label>
                    <Input type="date" value={attendanceReportFrom} onChange={e => setAttendanceReportFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={attendanceReportTo} onChange={e => setAttendanceReportTo(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAttendanceReportDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleDownloadAttendanceReport}
                    disabled={attendanceReportType === "platoon" ? !attendanceReportPlatoon : !attendanceReportCadet}
                  >Download</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      {/* Performance Report Card */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Performance Report</h3>
              <p className="text-sm text-muted-foreground">
                Performance evaluations and rankings
              </p>
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => generateReport('performance')}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</TabsContent>
    </Tabs>

    {/* Platoon Selection Dialog for Cadet Approval */}
    <Dialog open={showPlatoonDialog} onOpenChange={setShowPlatoonDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Platoon</DialogTitle>
          <DialogDescription>
            Choose a platoon for {selectedCadetForApproval?.name_full}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="platoon-select">Platoon</Label>
            <Select value={selectedPlatoonForApproval} onValueChange={setSelectedPlatoonForApproval}>
              <SelectTrigger>
                <SelectValue placeholder="Select platoon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Junior">Junior</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPlatoonDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmApproval} disabled={isPendingLoading || !selectedPlatoonForApproval}>
            {isPendingLoading ? "Approving..." : "Approve Cadet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</div>
  );
}
export default AdminDashboard;
