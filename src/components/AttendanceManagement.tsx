// ...existing code...
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, Users, Plus, FileText, Download, 
  CheckCircle, AlertCircle, XCircle, Timer
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PracticeSession {
  id: string;
  title: string;
  description: string;
  practice_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  cadet_name: string;
  application_number: string;
  platoon: string;
  entry_time: string;
  exit_time: string;
  participation_minutes: number;
  attendance_percentage: number;
  attendance_status: string;
}

const AttendanceManagement = () => {
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
      fetchPracticeSessions();
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
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadType, setDownloadType] = useState("");
  const [selectedPlatoon, setSelectedPlatoon] = useState("");
  const [selectedCadet, setSelectedCadet] = useState("");
  const [cadetSearch, setCadetSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterPlatoon, setFilterPlatoon] = useState("");
  const [filterCadet, setFilterCadet] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    practice_date: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchPracticeSessions();
  }, []);

  const fetchPracticeSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .order('practice_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch practice sessions: " + error.message,
        variant: "destructive",
      });
    }
  };

  const createPracticeSession = async () => {
    if (!newSession.title || !newSession.practice_date || !newSession.start_time || !newSession.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    if (newSession.start_time >= newSession.end_time) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const [sh, sm] = newSession.start_time.split(':').map(Number);
      const [eh, em] = newSession.end_time.split(':').map(Number);
      const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          title: newSession.title,
          description: newSession.description,
          practice_date: newSession.practice_date,
          start_time: newSession.start_time,
          end_time: newSession.end_time,
          duration_minutes: durationMinutes,
          created_by: (user?.id as string),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Practice session created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewSession({
        title: '',
        description: '',
        practice_date: '',
        start_time: '',
        end_time: ''
      });
      fetchPracticeSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create practice session: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceReport = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('get_attendance_report', { session_id: sessionId });

      if (error) throw error;
      // Find the session duration from selectedSession or sessions list
      let sessionDuration = selectedSession?.duration_minutes;
      if (!sessionDuration || sessionDuration <= 0) {
        const sessionObj = sessions.find(s => s.id === sessionId);
        sessionDuration = sessionObj?.duration_minutes || 0;
      }
      setAttendanceRecords((data || []).map(record => {
        let participation_minutes = 0;
        if (record.entry_time && record.exit_time) {
          const [eh, em] = record.exit_time.split(":").map(Number);
          const [sh, sm] = record.entry_time.split(":").map(Number);
          participation_minutes = (eh * 60 + em) - (sh * 60 + sm);
          if (participation_minutes < 0) participation_minutes = 0;
        }
        let attendance_percentage = 0;
        if (sessionDuration > 0) {
          attendance_percentage = (participation_minutes / sessionDuration) * 100;
          if (attendance_percentage < 0) attendance_percentage = 0;
          if (attendance_percentage > 100) attendance_percentage = 100;
        }
        // Set attendance status based on percentage
        let attendance_status = "absent";
        if (attendance_percentage >= 80) {
          attendance_status = "present";
        } else if (attendance_percentage >= 20) {
          attendance_status = "leave_early";
        }
        return {
          ...record,
          participation_minutes,
          attendance_percentage,
          attendance_status,
          id: record.id || `${record.cadet_name}-${sessionId}`,
        };
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance report: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAttendanceReport = async (session: PracticeSession) => {
    try {
      await fetchAttendanceReport(session.id);
      // Filter records
      let filteredRecords = attendanceRecords;
      if (filterFrom && filterTo) {
        filteredRecords = filteredRecords.filter(r => {
          const date = new Date(session.practice_date);
          return date >= new Date(filterFrom) && date <= new Date(filterTo);
        });
      }
      if (filterPlatoon) {
        filteredRecords = filteredRecords.filter(r => r.platoon === filterPlatoon);
      }
      if (filterCadet) {
        filteredRecords = filteredRecords.filter(r => r.cadet_name.toLowerCase().includes(filterCadet.toLowerCase()));
      }

      // Count number of days practices held
      const daysHeld = sessions.length;

      // Prepare table data
      const tableData = filteredRecords.map((r, idx) => [
        r.application_number,
        r.cadet_name,
        r.platoon,
        r.participation_minutes,
        r.attendance_percentage.toFixed(1) + "%",
        r.attendance_status,
        r.attendance_status === "present" ? "Yes" : "No"
      ]);

      // PDF generation
      const doc = new jsPDF();
      doc.text(`Attendance Report - ${session.title}`, 10, 10);
      doc.text(`Date: ${format(new Date(session.practice_date), 'PPP')}`, 10, 18);
      doc.text(`Practice Days Held: ${daysHeld}`, 10, 26);
      autoTable(doc, {
        head: [["Regiment No.", "Name", "Platoon", "Duration (min)", "Attendance %", "Status", "Eligible"]],
        body: tableData,
        startY: 32
      });
      doc.save(`attendance-report-${session.practice_date}-${session.title.replace(/\s+/g, '-')}.pdf`);

      toast({
        title: "Success",
        description: "Attendance report downloaded as PDF",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate report: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'leave_early':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Present</Badge>;
      case 'leave_early':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Left Early</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Absent</Badge>;
      default:
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  return (
  <div className="space-y-6">
      <div className="space-y-6">
        {/* Download Report Dialog */}
        <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
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
                <Button variant={downloadType === "platoon" ? "default" : "outline"} onClick={() => setDownloadType("platoon")}>Platoon</Button>
                <Button variant={downloadType === "cadet" ? "default" : "outline"} onClick={() => setDownloadType("cadet")}>Cadet</Button>
              </div>
            </div>
            {downloadType === "platoon" && (
              <div className="mb-4">
                <Label>Select Platoon</Label>
                <select className="w-full mt-2 p-2 border rounded" value={selectedPlatoon} onChange={e => setSelectedPlatoon(e.target.value)}>
                  <option value="">-- Select Platoon --</option>
                  {[...new Set(attendanceRecords.map(r => r.platoon).filter(Boolean))].map(platoon => (
                    <option key={platoon} value={platoon}>{platoon}</option>
                  ))}
                </select>
              </div>
            )}
            {downloadType === "cadet" && (
              <div className="mb-4">
                <Label>Select Cadet</Label>
                <select className="w-full mt-2 p-2 border rounded" value={selectedCadet} onChange={e => setSelectedCadet(e.target.value)}>
                  <option value="">-- Select Cadet --</option>
                  {[...new Set(attendanceRecords.map(r => r.cadet_name).filter(Boolean))].map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDownloadDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setIsDownloadDialogOpen(false);
                  if (downloadType === "platoon" && selectedPlatoon) {
                    setFilterPlatoon(selectedPlatoon);
                    setFilterCadet("");
                    generateAttendanceReport(selectedSession!);
                  } else if (downloadType === "cadet" && selectedCadet) {
                    setFilterCadet(selectedCadet);
                    setFilterPlatoon("");
                    generateAttendanceReport(selectedSession!);
                  }
                }}
                disabled={downloadType === "platoon" ? !selectedPlatoon : !selectedCadet}
              >Download</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* ...existing code... */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Practice Sessions</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <Card key={session.id} className="border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{session.title}</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(session.practice_date), 'PPP')} • {session.start_time} - {session.end_time}</div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button size="sm" variant="outline" onClick={() => setSelectedSession(session)}>
                    View Attendance
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)} disabled={isLoading}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
  {/* End Practice Sessions Grid */}
        {/* ...existing code... */}
      </div>
      {/* Create Practice Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Practice Session
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Practice Session</DialogTitle>
            <DialogDescription>
              Set up a new practice session for attendance tracking
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Practice Title *</Label>
              <Input
                id="title"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      placeholder="Weekly Drill Practice"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newSession.description}
                      onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                      placeholder="Description of the practice session"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="practice_date">Practice Date *</Label>
                      <Input
                        id="practice_date"
                        type="date"
                        value={newSession.practice_date}
                        onChange={(e) => setNewSession({ ...newSession, practice_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={newSession.start_time}
                        onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={newSession.end_time}
                        onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPracticeSession} disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Session"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        {/* Practice Sessions Grid */}
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No practice sessions created yet. Create your first session to start tracking attendance.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted ${
                    selectedSession?.id === session.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedSession(session);
                    fetchAttendanceReport(session.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{session.title}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.practice_date), 'PPP')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {session.start_time} - {session.end_time}
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-3 w-3" />
                          {session.duration_minutes} minutes
                        </div>
                      </div>
                      {session.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        {/* Attendance Report */}
        {selectedSession && (
          <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendance Report: {selectedSession.title}
                </CardTitle>
                <CardDescription>
                  {format(new Date(selectedSession.practice_date), 'PPP')} • 
                  {selectedSession.start_time} - {selectedSession.end_time} • 
                  {selectedSession.duration_minutes} minutes
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsDownloadDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading attendance data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Present</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {attendanceRecords.filter(r => r.attendance_status === 'present').length}
                      </div>
                      <p className="text-xs text-muted-foreground">80%+ attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold">Left Early</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {attendanceRecords.filter(r => r.attendance_status === 'leave_early').length}
                      </div>
                      <p className="text-xs text-muted-foreground">20-80% attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold">Absent</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {attendanceRecords.filter(r => r.attendance_status === 'absent').length}
                      </div>
                      <p className="text-xs text-muted-foreground">&lt;20% attendance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Total</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {attendanceRecords.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Registered cadets</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Detailed Attendance Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cadet Name</TableHead>
                        <TableHead>App No.</TableHead>
                        <TableHead>Platoon</TableHead>
                        <TableHead>Entry Time</TableHead>
                        <TableHead>Exit Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Attendance %</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id || `${record.application_number}-${selectedSession.id}`}>
                          <TableCell className="font-medium">{record.cadet_name}</TableCell>
                          <TableCell>{record.application_number}</TableCell>
                          <TableCell>
                            <Badge variant={record.platoon === 'Junior' ? 'secondary' : 'default'}>
                              {record.platoon || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.entry_time || '-'}</TableCell>
                          <TableCell>{record.exit_time || '-'}</TableCell>
                          <TableCell>{record.participation_minutes || 0} min</TableCell>
                          <TableCell>{record.attendance_percentage.toFixed(1)}%</TableCell>
                          <TableCell>{getStatusBadge(record.attendance_status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    {/* ...existing code... */}
  </div>
);
};

export default AttendanceManagement;