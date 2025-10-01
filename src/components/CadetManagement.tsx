import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Plus, Edit, Trash2, Award, AlertTriangle, 
  GraduationCap, Calendar, Activity, FileText, 
  Heart, UserCheck, Plane, Trophy, BookOpen, Target
} from "lucide-react";
  import { Globe } from "lucide-react";

interface Cadet {
  id: string;
  name_full: string;
  application_number: string;
  platoon: string;
  rank: string;
  master_remarks?: string;
  rector_recommendations?: string;
  withdrawal_reason?: string;
  withdrawal_date_from?: string;
  withdrawal_date_to?: string;
  battalion_acceptance_date?: string;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_description: string;
  date_achieved: string;
  camp_name: string;
  certificate_no: string;
}

interface DisciplinaryAction {
  id: string;
  date_of_action: string;
  offence: string;
  punishment: string;
}

interface EducationalQualification {
  id: string;
  exam_type: string;
  year: number;
  index_number: string;
  subject: string;
  grade: string;
}

interface TrainingCamp {
  id: string;
  camp_name: string;
  camp_level: string;
  location: string;
  duration_from: string;
  duration_to: string;
  remarks: string;
}

interface PerformanceEvaluation {
  id: string;
  evaluation_date: string;
  squad_drill: string;
  physical_training: string;
  assual: string;
  drama: string;
  presentation: string;
  regimental_duties: string;
  ncc_knowledge: string;
  first_aid: string;
}

interface AttendanceRecord {
  id: string;
  cadet_id: string;
  absent_dates: string;
  number_of_days: number;
  reason: string;
  excuse_letter_submitted: boolean;
  approval_status: boolean;
  eligibility?: boolean;
}

interface ExcuseLetterRecord {
  id: string;
  absent_dates: string;
  number_of_days: number;
  reason: string;
  approval_status: boolean;
  eligibility?: boolean;
}

interface EventParticipation {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  role_task: string;
}

interface ForeignVisit {
  id: string;
  cadet_id: string;
  country: string;
  event_name: string;
  duration_from: string;
  duration_to: string;
  remarks: string;
  created_at?: string;
}

interface MedicalRecord {
  id: string;
  issuance_party: string;
  date_of_issue: string;
  validity_end_date: string;
  medical_certificate_url: string;
}

interface TermEvaluation {
  id: string;
  term: string;
  subject: string;
  marks: number;
  total: number;
  position: number;
  average: number;
}

interface Promotion {
  id: string;
  from_rank: string;
  to_rank: string;
  promotion_type: string;
  effective_date: string;
}

const CadetManagement = () => {
interface SpecialEvent {
  id: string;
  cadet_id: string;
  duration_from: string;
  duration_to: string;
  event_name: string;
  role_description: string;
  created_at: string;
}
  const { toast } = useToast();
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Data states for different record types
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [educationalQualifications, setEducationalQualifications] = useState<EducationalQualification[]>([]);
  const [trainingCamps, setTrainingCamps] = useState<TrainingCamp[]>([]);
  const [performanceEvaluations, setPerformanceEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetterRecord[]>([]);
  // const [eventParticipations, setEventParticipations] = useState<EventParticipation[]>([]); // Not used, replaced by specialEvents
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [foreignVisits, setForeignVisits] = useState<ForeignVisit[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [termEvaluations, setTermEvaluations] = useState<TermEvaluation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Attendance Report Dialog states
  const [isAttendanceReportDialogOpen, setIsAttendanceReportDialogOpen] = useState(false);
  const [attendanceReportType, setAttendanceReportType] = useState('platoon');
  const [attendanceReportPlatoon, setAttendanceReportPlatoon] = useState('');
  const [attendanceReportCadet, setAttendanceReportCadet] = useState('');
  const [attendanceReportFrom, setAttendanceReportFrom] = useState('');
  const [attendanceReportTo, setAttendanceReportTo] = useState('');

  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("achievements");
  const [newRecord, setNewRecord] = useState<any>({});
  // Handler for attendance report download
  const handleDownloadAttendanceReport = async () => {
    let filteredRecords: AttendanceRecord[] = [];
    if (attendanceReportType === 'platoon') {
      filteredRecords = attendanceRecords.filter(r => selectedCadet && selectedCadet.platoon === attendanceReportPlatoon);
    } else if (attendanceReportType === 'cadet') {
      filteredRecords = attendanceRecords.filter(r => r.cadet_id === attendanceReportCadet);
    }
    if (attendanceReportFrom && attendanceReportTo) {
      filteredRecords = filteredRecords.filter(r => {
        const date = new Date(r.absent_dates);
        return date >= new Date(attendanceReportFrom) && date <= new Date(attendanceReportTo);
      });
    }
    // Generate PDF (simple example, you can use jsPDF/autotable for more advanced)
    let reportText = `Attendance Report\n\n`;
    filteredRecords.forEach(r => {
      reportText += `Date: ${r.absent_dates}, Days: ${r.number_of_days}, Reason: ${r.reason}, Approved: ${r.approval_status ? 'Yes' : 'No'}, Eligible: ${r.eligibility ? 'Yes' : 'No'}\n`;
    });
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    setIsAttendanceReportDialogOpen(false);
  };

  useEffect(() => {
    fetchCadets();
  }, []);

  useEffect(() => {
    if (selectedCadet) {
      fetchCadetRecords();
    }
  }, [selectedCadet]);

  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select('id, name_full, name_with_initials, application_number, platoon, rank, age, status')
        .order('name_full');

      if (error) throw error;
  setCadets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadets: " + error.message,
        variant: "destructive",
      });
    }
  };
  // ...pending cadet handlers removed...
  // Example Pending Cadets Table (add this to your render/UI where appropriate)
  // <Table>
  //   <TableHeader>
  //     <TableRow>
  //       <TableHead>Name</TableHead>
  //       <TableHead>Application Number</TableHead>
  //       <TableHead>Platoon</TableHead>
  //       <TableHead>Actions</TableHead>
  //     </TableRow>
  //   </TableHeader>
  //   <TableBody>
  //     {pendingCadets.map(cadet => (
  //       <TableRow key={cadet.id}>
  //         <TableCell>{cadet.name_full}</TableCell>
  //         <TableCell>{cadet.application_number}</TableCell>
  //         <TableCell>{cadet.platoon}</TableCell>
  //         <TableCell>
  //           <Button onClick={() => handleApproveCadet(cadet)}>Approve</Button>
  //           <Button variant="destructive" onClick={() => handleRejectCadet(cadet)}>Reject</Button>
  //         </TableCell>
  //       </TableRow>
  //     ))}
  //   </TableBody>
  // </Table>

  const fetchCadetRecords = async () => {
    if (!selectedCadet) return;

    try {
      setIsLoading(true);
      
      // Fetch all record types for the selected cadet
      const [
        achievementsRes,
        disciplinaryRes,
        educationalRes,
        trainingRes,
        performanceRes,
        attendanceRes,
        excuseLettersRes,
        specialEventsRes,
        foreignRes,
        medicalRes,
        termRes,
        promotionsRes
      ] = await Promise.all([
        supabase.from('achievements').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('disciplinary_actions').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('educational_qualifications').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('training_camps').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('performance_evaluations').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('attendance_records').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('excuse_letters').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('special_events').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('foreign_visits').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('medical_records').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('term_evaluations').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('promotions').select('*').eq('cadet_id', selectedCadet.id)
      ]);

    setAchievements(achievementsRes.data || []);
    setDisciplinaryActions(disciplinaryRes.data || []);
    setEducationalQualifications(educationalRes.data || []);
    setTrainingCamps(trainingRes.data || []);
    setPerformanceEvaluations(performanceRes.data || []);
    setAttendanceRecords(attendanceRes.data || []);
    setExcuseLetters(excuseLettersRes.data || []);
    setSpecialEvents(specialEventsRes.data || []);
    setForeignVisits(foreignRes.data || []);
    setMedicalRecords(medicalRes.data || []);
    setTermEvaluations(termRes.data || []);
    setPromotions(promotionsRes.data || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadet records: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRecord = async (
  tableName: 'achievements' | 'disciplinary_actions' | 'educational_qualifications' | 'training_camps' | 'performance_evaluations' | 'special_events' | 'cadets' | 'foreign_visits',
    recordData: any
  ) => {
    // If adding a cadet, ensure status is set to 'pending'
    if (tableName === 'cadets') {
      recordData.status = 'pending';
    }
    if (!selectedCadet && tableName !== 'cadets') return;

    try {
      setIsLoading(true);

      // Special handling for educational qualifications with multiple subjects
      if (tableName === 'educational_qualifications' && Array.isArray(recordData.subjects) && recordData.subjects.length > 0) {
        // Build multiple rows, one per subject/grade. Skip empty entries.
        const rows = recordData.subjects
          .filter((sg: any) => sg && (sg.subject || sg.grade))
          .map((sg: any) => ({
            cadet_id: selectedCadet.id,
            exam_type: recordData.exam_type || null,
            year: recordData.year || null,
            index_number: recordData.index_number || null,
            subject: sg.subject || null,
            grade: sg.grade || null,
          }));

        if (rows.length === 0) {
          throw new Error('No valid subjects provided');
        }

        const { error } = await supabase.from('educational_qualifications').insert(rows);
        if (error) throw error;
      } else {
        // Single-row insert for other tables or when no subjects array provided
        let payload = { ...recordData };
        if (tableName !== 'cadets') {
          payload.cadet_id = selectedCadet.id;
        }
        // If subjects exists but is not an array, remove it to avoid schema errors
        if (payload.subjects) delete payload.subjects;

        const { error } = await supabase
          .from(tableName)
          .insert(payload);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Record added successfully',
      });

      setIsAddDialogOpen(false);
      setNewRecord({});
      if (tableName === 'cadets') {
        fetchCadets();
      } else {
        fetchCadetRecords();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add record: ' + (error?.message || String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async (
    tableName: 'achievements' | 'disciplinary_actions' | 'educational_qualifications' | 'training_camps' | 'attendance_records' | 'excuse_letters' | 'performance_evaluations' | 'special_events' | 'foreign_visits',
    recordId: string
  ) => {

              // ...existing code...
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });

      fetchCadetRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete record: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.name_full.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.application_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRecordForm = () => {
    switch (activeTab) {
      case "achievements":
        // Use allowed values for achievement_type (update as per your Supabase check constraint)
        const achievementTypeOptions = [
          "Certificate",
          "Medal",
          "Trophy",
          "Badge",
          "Other"
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Achievement Type</Label>
              <Select
                value={newRecord.achievement_type || ''}
                onValueChange={(value) => setNewRecord({ ...newRecord, achievement_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select achievement type" />
                </SelectTrigger>
                <SelectContent>
                  {achievementTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Achieved</Label>
              <Input
                type="date"
                value={newRecord.date_achieved || ''}
                onChange={(e) => setNewRecord({...newRecord, date_achieved: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newRecord.achievement_description || ''}
                onChange={(e) => setNewRecord({...newRecord, achievement_description: e.target.value})}
                placeholder="Description of the achievement"
              />
            </div>
            <div className="space-y-2">
              <Label>Camp/Event Name</Label>
              <Input
                value={newRecord.camp_name || ''}
                onChange={(e) => setNewRecord({...newRecord, camp_name: e.target.value})}
                placeholder="Name of camp or event"
              />
            </div>
            <div className="space-y-2">
              <Label>Certificate Number</Label>
              <Input
                value={newRecord.certificate_no || ''}
                onChange={(e) => setNewRecord({...newRecord, certificate_no: e.target.value})}
                placeholder="Certificate number if applicable"
              />
            </div>
          </div>
        );

      case "disciplinary":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Action</Label>
              <Input
                type="date"
                value={newRecord.date_of_action || ''}
                onChange={(e) => setNewRecord({...newRecord, date_of_action: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Offence</Label>
              <Input
                value={newRecord.offence || ''}
                onChange={(e) => setNewRecord({...newRecord, offence: e.target.value})}
                placeholder="Description of offence"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Punishment</Label>
              <Textarea
                value={newRecord.punishment || ''}
                onChange={(e) => setNewRecord({...newRecord, punishment: e.target.value})}
                placeholder="Punishment given"
              />
            </div>
          </div>
        );

      case "education":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Exam Type</Label>
              <Select
                value={newRecord.exam_type || ''}
                onValueChange={(value) => setNewRecord({...newRecord, exam_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GCE O/L">GCE O/L</SelectItem>
                  <SelectItem value="GCE A/L">GCE A/L</SelectItem>
                  <SelectItem value="1st term">1st term</SelectItem>
                  <SelectItem value="2nd term">2nd term</SelectItem>
                  <SelectItem value="3rd term">3rd term</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={newRecord.year || ''}
                onChange={(e) => setNewRecord({...newRecord, year: parseInt(e.target.value)})}
                placeholder="Exam year"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Index Number</Label>
              <Input
                value={newRecord.index_number || ''}
                onChange={(e) => setNewRecord({...newRecord, index_number: e.target.value})}
                placeholder="Index number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Subjects & Grades</Label>
              {(newRecord.subjects || [{ subject: '', grade: '' }]).map((sg: { subject: string; grade: string }, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={sg.subject}
                    onChange={e => {
                      const updated = [...(newRecord.subjects || [])];
                      updated[idx].subject = e.target.value;
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    placeholder="Subject name"
                    className="w-1/2"
                  />
                  <Input
                    value={sg.grade}
                    onChange={e => {
                      const updated = [...(newRecord.subjects || [])];
                      updated[idx].grade = e.target.value;
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    placeholder="Grade"
                    className="w-1/2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...(newRecord.subjects || [])];
                      updated.splice(idx, 1);
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    className="text-destructive"
                  >Remove</Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNewRecord({
                    ...newRecord,
                    subjects: [...(newRecord.subjects || []), { subject: '', grade: '' }],
                  });
                }}
              >Add Subject</Button>
            </div>
          </div>
        );

      case "training":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Camp Name</Label>
              <Input
                value={newRecord.camp_name || ''}
                onChange={(e) => setNewRecord({...newRecord, camp_name: e.target.value})}
                placeholder="Name of training camp"
              />
            </div>
            <div className="space-y-2">
              <Label>Camp Level</Label>
              <Select
                value={newRecord.camp_level || ''}
                onValueChange={(value) => setNewRecord({...newRecord, camp_level: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camp level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company Level</SelectItem>
                  <SelectItem value="Battalion">Battalion Level</SelectItem>
                  <SelectItem value="Provincial">Provincial Level</SelectItem>
                  <SelectItem value="National">National Level</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={newRecord.location || ''}
                onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
                placeholder="Camp location"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration From</Label>
              <Input
                type="date"
                value={newRecord.duration_from || ''}
                onChange={(e) => setNewRecord({...newRecord, duration_from: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration To</Label>
              <Input
                type="date"
                value={newRecord.duration_to || ''}
                onChange={(e) => setNewRecord({...newRecord, duration_to: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={newRecord.remarks || ''}
                onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
                placeholder="Additional remarks"
              />
            </div>
          </div>
        );

      case "performance":
        const scoreOptions = ["1", "2", "3", "4"];
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newRecord.evaluation_date || ''}
                onChange={(e) => setNewRecord({ ...newRecord, evaluation_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Squad Drill</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.squad_drill || ''}
                onChange={e => setNewRecord({ ...newRecord, squad_drill: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Physical Training</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.physical_training || ''}
                onChange={e => setNewRecord({ ...newRecord, physical_training: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assual</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.assual || ''}
                onChange={e => setNewRecord({ ...newRecord, assual: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Drama</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.drama || ''}
                onChange={e => setNewRecord({ ...newRecord, drama: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Presentation</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.presentation || ''}
                onChange={e => setNewRecord({ ...newRecord, presentation: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Regimental Duties</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.regimental_duties || ''}
                onChange={e => setNewRecord({ ...newRecord, regimental_duties: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>NCC Knowledge</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.ncc_knowledge || ''}
                onChange={e => setNewRecord({ ...newRecord, ncc_knowledge: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>First Aid</Label>
              <select
                className="w-full p-2 border rounded"
                value={newRecord.first_aid || ''}
                onChange={e => setNewRecord({ ...newRecord, first_aid: e.target.value })}
                required
              >
                <option value="">Select score</option>
                {scoreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        );

      default:
        return <div>Select a record type to add</div>;
    }
  };

  const renderRecordTable = () => {
    switch (activeTab) {
      case "achievements":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Achievement Type</TableHead>
                <TableHead>Date Achieved</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Camp/Event Name</TableHead>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {achievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell>{achievement.achievement_type}</TableCell>
                  <TableCell>{achievement.date_achieved}</TableCell>
                  <TableCell>{achievement.achievement_description}</TableCell>
                  <TableCell>{achievement.camp_name}</TableCell>
                  <TableCell>{achievement.certificate_no}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('achievements', achievement.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "disciplinary":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Offence</TableHead>
                <TableHead>Punishment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinaryActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>{action.date_of_action}</TableCell>
                  <TableCell>{action.offence}</TableCell>
                  <TableCell>{action.punishment}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('disciplinary_actions', action.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "education":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educationalQualifications.map((qual) => (
                <TableRow key={qual.id}>
                  <TableCell>{qual.exam_type}</TableCell>
                  <TableCell>{qual.year}</TableCell>
                  <TableCell>{qual.subject}</TableCell>
                  <TableCell>{qual.grade}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('educational_qualifications', qual.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "training":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camp Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingCamps.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell>{camp.camp_name}</TableCell>
                  <TableCell>{camp.camp_level}</TableCell>
                  <TableCell>{camp.location}</TableCell>
                  <TableCell>{camp.duration_from} to {camp.duration_to}</TableCell>
                  <TableCell>{camp.remarks}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('training_camps', camp.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "performance":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Squad Drill</TableHead>
                <TableHead>Physical Training</TableHead>
                <TableHead>Assual</TableHead>
                <TableHead>Drama</TableHead>
                <TableHead>Presentation</TableHead>
                <TableHead>Regimental Duties</TableHead>
                <TableHead>NCC Knowledge</TableHead>
                <TableHead>First Aid</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceEvaluations.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.evaluation_date}</TableCell>
                  <TableCell>{record.squad_drill}</TableCell>
                  <TableCell>{record.physical_training}</TableCell>
                  <TableCell>{record.assual}</TableCell>
                  <TableCell>{record.drama}</TableCell>
                  <TableCell>{record.presentation}</TableCell>
                  <TableCell>{record.regimental_duties}</TableCell>
                  <TableCell>{record.ncc_knowledge}</TableCell>
                  <TableCell>{record.first_aid}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('performance_evaluations', record.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "foreign":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={newRecord.country || ''}
                onChange={e => setNewRecord({ ...newRecord, country: e.target.value })}
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={newRecord.event_name || ''}
                onChange={e => setNewRecord({ ...newRecord, event_name: e.target.value })}
                placeholder="Event Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration From</Label>
              <Input
                type="date"
                value={newRecord.duration_from || ''}
                onChange={e => setNewRecord({ ...newRecord, duration_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration To</Label>
              <Input
                type="date"
                value={newRecord.duration_to || ''}
                onChange={e => setNewRecord({ ...newRecord, duration_to: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Remarks</Label>
              <Textarea
                value={newRecord.remarks || ''}
                onChange={e => setNewRecord({ ...newRecord, remarks: e.target.value })}
                placeholder="Remarks"
              />
            </div>
          </div>
        );
      default:
        return <div>Select a record type to view</div>;
      {/* Foreign Visits Tab Content */}
      <TabsContent value="foreign" className="space-y-6 mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Foreign Visits</h2>
          <Button variant="secondary" onClick={() => { setActiveTab('foreign'); setIsAddDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Visit
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Event Name</TableHead>
              <TableHead>Duration From</TableHead>
              <TableHead>Duration To</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foreignVisits.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No foreign visits found.</TableCell>
              </TableRow>
            )}
            {foreignVisits.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell>{visit.country}</TableCell>
                <TableCell>{visit.event_name}</TableCell>
                <TableCell>{visit.duration_from}</TableCell>
                <TableCell>{visit.duration_to}</TableCell>
                <TableCell>{visit.remarks}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRecord('foreign_visits', visit.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    }
  };

  return (

    <div className="space-y-6">
      {/* Pending Cadets Table */}
      {/* Pending cadets UI removed */}
      {/* Cadet Selection & Records Management (existing UI) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Cadet to Manage
          </CardTitle>
          <CardDescription>
            Choose a cadet to view and manage their additional records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search by name or application number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="secondary">{filteredCadets.length} cadets</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {filteredCadets.map((cadet) => (
                <Card
                  key={cadet.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCadet?.id === cadet.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                  }`}
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
          </div>
        </CardContent>
      </Card>

      {/* Selected Cadet Records Management */}
      {selectedCadet && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Managing: {selectedCadet.name_full}</span>
              <Badge variant="secondary" className="text-sm">
                App No: {selectedCadet.application_number}
              </Badge>
            </CardTitle>
            <CardDescription>
              Add and manage additional records for this cadet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Admin Fields Section - Certificate & Withdrawal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Platoon</Label>
                <Input
                  value={selectedCadet.platoon || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, platoon: e.target.value })}
                  placeholder="Platoon"
                />
              </div>
              <div className="space-y-2">
                <Label>Rank</Label>
                <Input
                  value={selectedCadet.rank || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, rank: e.target.value })}
                  placeholder="Rank"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Master's Remarks for Final Certificate</Label>
                <Textarea
                  value={selectedCadet.master_remarks || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, master_remarks: e.target.value })}
                  placeholder="Master in charge remarks for the issuance of the final certificate"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Rector's/Principal's Recommendations</Label>
                <Textarea
                  value={selectedCadet.rector_recommendations || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, rector_recommendations: e.target.value })}
                  placeholder="Recommendations of the Rector/Principal to issue the final certificate"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Withdrawal Reason</Label>
                <Input
                  value={selectedCadet.withdrawal_reason || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, withdrawal_reason: e.target.value })}
                  placeholder="Reason for withdrawal (if applicable)"
                />
              </div>
              <div className="space-y-2">
                <Label>Withdrawal Date From</Label>
                <Input
                  type="date"
                  value={selectedCadet.withdrawal_date_from || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, withdrawal_date_from: e.target.value })}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label>Withdrawal Date To</Label>
                <Input
                  type="date"
                  value={selectedCadet.withdrawal_date_to || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, withdrawal_date_to: e.target.value })}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Battalion Acceptance Date</Label>
                <Input
                  type="date"
                  value={selectedCadet.battalion_acceptance_date || ''}
                  onChange={e => setSelectedCadet({ ...selectedCadet, battalion_acceptance_date: e.target.value })}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <Button
                className="col-span-2 mt-2"
                onClick={async () => {
                  // Save updated admin fields to Supabase
                  try {
                    setIsLoading(true);
                    const { error } = await supabase
                      .from('cadets')
                      .update({
                        platoon: selectedCadet.platoon,
                        rank: selectedCadet.rank,
                        master_remarks: selectedCadet.master_remarks,
                        rector_recommendations: selectedCadet.rector_recommendations,
                        withdrawal_reason: selectedCadet.withdrawal_reason,
                        withdrawal_date_from: selectedCadet.withdrawal_date_from,
                        withdrawal_date_to: selectedCadet.withdrawal_date_to,
                        battalion_acceptance_date: selectedCadet.battalion_acceptance_date,
                      })
                      .eq('id', selectedCadet.id);
                    if (error) throw error;
                    toast({ title: 'Success', description: 'Cadet details updated.' });
                    fetchCadets();
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >Save Details</Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="relative flex justify-center min-h-[110px]">
                <div className="absolute left-0 top-0 w-full h-full bg-muted rounded-lg z-0" />
                <TabsList
                  className="flex flex-wrap gap-1 px-0 py-2 min-h-[90px] sm:min-h-[60px] w-full max-w-full items-center relative z-10 justify-center"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <TabsTrigger value="achievements" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Award className="h-4 w-4" />
                    <span className="ml-1">Achievements</span>
                  </TabsTrigger>
                  <TabsTrigger value="disciplinary" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="ml-1">Disciplinary</span>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span className="ml-1">Education</span>
                  </TabsTrigger>
                  <TabsTrigger value="training" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Target className="h-4 w-4" />
                    <span className="ml-1">Training</span>
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Activity className="h-4 w-4" />
                    <span className="ml-1">Performance</span>
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span className="ml-1">Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger value="excuse_letters" className="flex items-center gap-1 min-w-[120px] sm:min-w-[100px] px-2 py-1 justify-center text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span className="ml-1">Excuse Letters</span>
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="ml-1">Events</span>
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Heart className="h-4 w-4" />
                    <span className="ml-1">Medical</span>
                  </TabsTrigger>
                  <TabsTrigger value="foreign" className="flex items-center gap-1 min-w-[120px] sm:min-w-[100px] px-2 py-1 justify-center text-sm">
                    <Globe className="h-4 w-4" />
                    <span className="ml-1">Foreign Visits</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Achievements Tab Content */}
              <TabsContent value="achievements" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Achievements & Awards</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('achievements'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              {/* Special Events Tab Content - now after menu bar, matching Achievements */}
              <TabsContent value="events" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Special Events</h2>
                  <Button variant="secondary" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Role Description</TableHead>
                      <TableHead>Duration From</TableHead>
                      <TableHead>Duration To</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No special events found.</TableCell>
                      </TableRow>
                    )}
                    {specialEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.event_name}</TableCell>
                        <TableCell>{event.role_description}</TableCell>
                        <TableCell>{event.duration_from}</TableCell>
                        <TableCell>{event.duration_to}</TableCell>
                        <TableCell>{event.created_at ? event.created_at.split('T')[0] : ''}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('special_events', event.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              {/* Foreign Visits Tab Content */}
              <TabsContent value="foreign" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Foreign Visits</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('foreign'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Visit
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Duration From</TableHead>
                      <TableHead>Duration To</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foreignVisits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No foreign visits found.</TableCell>
                      </TableRow>
                    )}
                    {foreignVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>{visit.country}</TableCell>
                        <TableCell>{visit.event_name}</TableCell>
                        <TableCell>{visit.duration_from}</TableCell>
                        <TableCell>{visit.duration_to}</TableCell>
                        <TableCell>{visit.remarks}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('foreign_visits', visit.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="performance" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Performance</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('performance'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Squad Drill</TableHead>
                      <TableHead>Physical Training</TableHead>
                      <TableHead>Assual</TableHead>
                      <TableHead>Drama</TableHead>
                      <TableHead>Presentation</TableHead>
                      <TableHead>Regimental Duties</TableHead>
                      <TableHead>NCC Knowledge</TableHead>
                      <TableHead>First Aid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceEvaluations.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.evaluation_date}</TableCell>
                        <TableCell>{record.squad_drill}</TableCell>
                        <TableCell>{record.physical_training}</TableCell>
                        <TableCell>{record.assual}</TableCell>
                        <TableCell>{record.drama}</TableCell>
                        <TableCell>{record.presentation}</TableCell>
                        <TableCell>{record.regimental_duties}</TableCell>
                        <TableCell>{record.ncc_knowledge}</TableCell>
                        <TableCell>{record.first_aid}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('performance_evaluations', record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="disciplinary" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Disciplinary Actions</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('disciplinary'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              <TabsContent value="education" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Educational Qualifications</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('education'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              <TabsContent value="training" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Training Camps</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('training'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              {/* Add Record Dialog (rendered once, for the active tab, outside TabsContent) */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Record</DialogTitle>
                    <DialogDescription>Fill in the details below.</DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (activeTab === 'achievements') addRecord('achievements', newRecord);
                      else if (activeTab === 'disciplinary') addRecord('disciplinary_actions', newRecord);
                      else if (activeTab === 'performance') addRecord('performance_evaluations', newRecord);
                      else if (activeTab === 'education') addRecord('educational_qualifications', {
                        ...newRecord,
                        subject: (newRecord.subjects && newRecord.subjects.length > 0) ? newRecord.subjects.map(sg => sg.subject).join(', ') : '',
                        grade: (newRecord.subjects && newRecord.subjects.length > 0) ? newRecord.subjects.map(sg => sg.grade).join(', ') : '',
                      });
                      else if (activeTab === 'training') addRecord('training_camps', newRecord);
                      else if (activeTab === 'events') addRecord('special_events', newRecord);
                      else if (activeTab === 'foreign') addRecord('foreign_visits', newRecord);
                    }}
                  >
                    {/* Only render the form fields once for all tabs except events and foreign, which have custom fields */}
                    {activeTab === 'events' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Event Name</Label>
                          <Input value={newRecord.event_name || ''} onChange={e => setNewRecord({ ...newRecord, event_name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Role Description</Label>
                          <Input value={newRecord.role_description || ''} onChange={e => setNewRecord({ ...newRecord, role_description: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration From</Label>
                          <Input type="date" value={newRecord.duration_from || ''} onChange={e => setNewRecord({ ...newRecord, duration_from: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration To</Label>
                          <Input type="date" value={newRecord.duration_to || ''} onChange={e => setNewRecord({ ...newRecord, duration_to: e.target.value })} required />
                        </div>
                      </>
                    ) : activeTab === 'foreign' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={newRecord.country || ''}
                            onChange={e => setNewRecord({ ...newRecord, country: e.target.value })}
                            placeholder="Country"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Name</Label>
                          <Input
                            value={newRecord.event_name || ''}
                            onChange={e => setNewRecord({ ...newRecord, event_name: e.target.value })}
                            placeholder="Event Name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration From</Label>
                          <Input
                            type="date"
                            value={newRecord.duration_from || ''}
                            onChange={e => setNewRecord({ ...newRecord, duration_from: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration To</Label>
                          <Input
                            type="date"
                            value={newRecord.duration_to || ''}
                            onChange={e => setNewRecord({ ...newRecord, duration_to: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Remarks</Label>
                          <Textarea
                            value={newRecord.remarks || ''}
                            onChange={e => setNewRecord({ ...newRecord, remarks: e.target.value })}
                            placeholder="Remarks"
                          />
                        </div>
                      </div>
                    ) : renderRecordForm()}
                    <div className="flex justify-end mt-4">
                      <Button type="submit">Save</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Attendance Tab Content */}
              <TabsContent value="attendance" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Attendance Records</h2>
                  <Button variant="secondary" onClick={() => setIsAttendanceReportDialogOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" /> Attendance Report
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Number of Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.absent_dates}</TableCell>
                        <TableCell>{record.number_of_days}</TableCell>
                        <TableCell>{record.reason}</TableCell>
                        <TableCell>{record.approval_status ? 'Approved' : 'Pending'}</TableCell>
                        <TableCell>{record.eligibility ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('attendance_records', record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Attendance Report Dialog */}
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
              </TabsContent>
              {/* Excuse Letters Tab Content */}
              <TabsContent value="excuse_letters" className="space-y-6 mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Number of Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(excuseLetters || []).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.absent_dates}</TableCell>
                        <TableCell>{record.number_of_days}</TableCell>
                        <TableCell>{record.reason}</TableCell>
                        <TableCell>{record.approval_status ? 'Approved' : 'Pending'}</TableCell>
                        <TableCell>{record.eligibility ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('excuse_letters', record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default CadetManagement;