import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from '../features/auth/authSlice';
import { getPortalRouteForRole, MODULE_KEYS } from '../utils/constants';
import AuthGuard from '../components/guards/AuthGuard';
import ModuleRouteGuard from '../components/guards/ModuleRouteGuard';
import LoginPage from '../portals/LoginPage';
import AccessDeniedPage from '../portals/AccessDeniedPage';
import SuperAdminLayout from '../portals/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from '../portals/SuperAdmin/Dashboard';
import InstitutesList from '../portals/SuperAdmin/InstitutesList';
import InstituteCreate from '../portals/SuperAdmin/InstituteCreate';
import InstituteDetail from '../portals/SuperAdmin/InstituteDetail';
import PlansList from '../portals/SuperAdmin/PlansList';
import InvoicesList from '../portals/SuperAdmin/InvoicesList';
import TicketsList from '../portals/SuperAdmin/TicketsList';
import InstituteAdminLayout from '../portals/InstituteAdmin/InstituteAdminLayout';
import InstituteAdminDashboard from '../portals/InstituteAdmin/Dashboard';
import AcademicSetup from '../portals/InstituteAdmin/AcademicSetup';
import StudentsList from '../portals/InstituteAdmin/StudentsList';
import StudentDetail from '../portals/InstituteAdmin/StudentDetail';
import TeachersList from '../portals/InstituteAdmin/TeachersList';
import TeacherDetail from '../portals/InstituteAdmin/TeacherDetail';
import IndividualCoursesList from '../portals/InstituteAdmin/IndividualCoursesList';
import IndividualCourseDetail from '../portals/InstituteAdmin/IndividualCourseDetail';
import DegreesList from '../portals/InstituteAdmin/DegreesList';
import DegreeDetail from '../portals/InstituteAdmin/DegreeDetail';
import DegreeBatchDetail from '../portals/InstituteAdmin/DegreeBatchDetail';
import DegreeStudentDetail from '../portals/InstituteAdmin/DegreeStudentDetail';
import ExamDetail from '../portals/InstituteAdmin/ExamDetail';
import ExamsPage from '../portals/InstituteAdmin/ExamsPage';
import ResultsPage from '../portals/InstituteAdmin/ResultsPage';
import AttendancePage from '../portals/InstituteAdmin/AttendancePage';
import FeesPage from '../portals/InstituteAdmin/FeesPage';
import SubscriptionPage from '../portals/InstituteAdmin/SubscriptionPage';
import TicketsPage from '../portals/InstituteAdmin/TicketsPage';
import TicketDetail from '../portals/InstituteAdmin/TicketDetail';
import ProfileSettings from '../portals/InstituteAdmin/ProfileSettings';
import PortalLogins from '../portals/InstituteAdmin/PortalLogins';
import IdCardPage from '../portals/InstituteAdmin/IdCardPage';
import ReportsPage from '../portals/InstituteAdmin/ReportsPage';
import TeacherLayout from '../portals/Teacher/TeacherLayout';
import TeacherDashboard from '../portals/Teacher/Dashboard';
import TeacherClasses from '../portals/Teacher/Classes';
import TeacherAttendance from '../portals/Teacher/Attendance';
import TeacherMarks from '../portals/Teacher/Marks';
import TeacherStudents from '../portals/Teacher/Students';
import TeacherTimetable from '../portals/Teacher/Timetable';
import TeacherSalary from '../portals/Teacher/Salary';
import TeacherLeave from '../portals/Teacher/Leave';
import TeacherTickets from '../portals/Teacher/Tickets';
import TeacherTicketDetail from '../portals/Teacher/TicketDetail';
import StudentLayout from '../portals/Student/StudentLayout';
import StudentDashboard from '../portals/Student/Dashboard';
import StudentProfile from '../portals/Student/Profile';
import StudentResults from '../portals/Student/Results';
import StudentAttendance from '../portals/Student/Attendance';
import StudentFees from '../portals/Student/Fees';
import StudentTimetable from '../portals/Student/Timetable';
import StudentDocuments from '../portals/Student/Documents';
import StudentNotifications from '../portals/Student/Notifications';
import StudentTickets from '../portals/Student/Tickets';
import StudentTicketDetail from '../portals/Student/TicketDetail';
import TeacherDocuments from '../portals/Teacher/Documents';
import ParentDashboard from '../portals/Parent/Dashboard';

function RootRedirect() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (isAuthenticated && user) {
    if (user.subscriptionExpired && user.role === 'INSTITUTE_ADMIN') {
      return <Navigate to="/admin/subscription" replace />;
    }
    return <Navigate to={user.portalRoute || getPortalRouteForRole(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

function Mod({ moduleKey, children }) {
  return <ModuleRouteGuard moduleKey={moduleKey}>{children}</ModuleRouteGuard>;
}

export default function AppRouter() {
  const dispatch = useDispatch();
  const { initializing } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      <Route path="/sa" element={
        <AuthGuard allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminLayout />
        </AuthGuard>
      }>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="institutes" element={<InstitutesList />} />
        <Route path="institutes/new" element={<InstituteCreate />} />
        <Route path="institutes/:id" element={<InstituteDetail />} />
        <Route path="plans" element={<PlansList />} />
        <Route path="invoices" element={<InvoicesList />} />
        <Route path="tickets" element={<TicketsList />} />
      </Route>

      <Route path="/admin" element={
        <AuthGuard allowedRoles={['INSTITUTE_ADMIN', 'ACCOUNTANT', 'HR', 'LIBRARIAN', 'RECEPTIONIST', 'STAFF']}>
          <InstituteAdminLayout />
        </AuthGuard>
      }>
        <Route index element={<InstituteAdminDashboard />} />
        <Route path="academic" element={<Mod moduleKey={MODULE_KEYS.STUDENT_MANAGEMENT}><AcademicSetup /></Mod>} />
        <Route path="students" element={<Mod moduleKey={MODULE_KEYS.STUDENT_MANAGEMENT}><StudentsList /></Mod>} />
        <Route path="students/:id" element={<Mod moduleKey={MODULE_KEYS.STUDENT_MANAGEMENT}><StudentDetail /></Mod>} />
        <Route path="teachers" element={<Mod moduleKey={MODULE_KEYS.TEACHER_MANAGEMENT}><TeachersList /></Mod>} />
        <Route path="teachers/:id" element={<Mod moduleKey={MODULE_KEYS.TEACHER_MANAGEMENT}><TeacherDetail /></Mod>} />
        <Route path="individual-courses" element={<Mod moduleKey={MODULE_KEYS.INDIVIDUAL_COURSES}><IndividualCoursesList /></Mod>} />
        <Route path="individual-courses/:id" element={<Mod moduleKey={MODULE_KEYS.INDIVIDUAL_COURSES}><IndividualCourseDetail /></Mod>} />
        <Route path="degrees" element={<Mod moduleKey={MODULE_KEYS.DEGREE}><DegreesList /></Mod>} />
        <Route path="degrees/batches/:batchId" element={<Mod moduleKey={MODULE_KEYS.DEGREE}><DegreeBatchDetail /></Mod>} />
        <Route path="degrees/students/:degreeStudentId" element={<Mod moduleKey={MODULE_KEYS.DEGREE}><DegreeStudentDetail /></Mod>} />
        <Route path="degrees/:degreeId" element={<Mod moduleKey={MODULE_KEYS.DEGREE}><DegreeDetail /></Mod>} />
        <Route path="exams/:id" element={<Mod moduleKey={MODULE_KEYS.RESULTS_EXAMS}><ExamDetail /></Mod>} />
        <Route path="credentials" element={
          <AuthGuard allowedRoles={['INSTITUTE_ADMIN']}>
            <PortalLogins />
          </AuthGuard>
        } />
        <Route path="exams" element={<Mod moduleKey={MODULE_KEYS.RESULTS_EXAMS}><ExamsPage /></Mod>} />
        <Route path="results" element={<Mod moduleKey={MODULE_KEYS.RESULTS_EXAMS}><ResultsPage /></Mod>} />
        <Route path="attendance" element={<Mod moduleKey={MODULE_KEYS.ATTENDANCE}><AttendancePage /></Mod>} />
        <Route path="fees" element={<Mod moduleKey={MODULE_KEYS.FEES_FINANCE}><FeesPage /></Mod>} />
        <Route path="idcard" element={<Mod moduleKey={MODULE_KEYS.ID_CARD_DESIGNER}><IdCardPage /></Mod>} />
        <Route path="reports" element={<Mod moduleKey={MODULE_KEYS.REPORTS}><ReportsPage /></Mod>} />
        <Route path="settings" element={<Mod moduleKey={MODULE_KEYS.PROFILE_SETTINGS}><ProfileSettings /></Mod>} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
      </Route>

      <Route path="/teacher" element={
        <AuthGuard allowedRoles={['TEACHER']}>
          <TeacherLayout />
        </AuthGuard>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="timetable" element={<TeacherTimetable />} />
        <Route path="salary" element={<TeacherSalary />} />
        <Route path="leave" element={<TeacherLeave />} />
        <Route path="tickets" element={<TeacherTickets />} />
        <Route path="tickets/:id" element={<TeacherTicketDetail />} />
        <Route path="documents" element={<TeacherDocuments />} />
      </Route>

      <Route path="/student" element={
        <AuthGuard allowedRoles={['STUDENT']}>
          <StudentLayout />
        </AuthGuard>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="tickets" element={<StudentTickets />} />
        <Route path="tickets/:id" element={<StudentTicketDetail />} />
        <Route path="documents" element={<StudentDocuments />} />
      </Route>

      <Route path="/parent" element={
        <AuthGuard allowedRoles={['PARENT']}>
          <ParentDashboard />
        </AuthGuard>
      } />

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
