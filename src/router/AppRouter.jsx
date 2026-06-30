import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from '../features/auth/authSlice';
import { getPortalRouteForRole } from '../utils/constants';
import AuthGuard from '../components/guards/AuthGuard';
import LoginPage from '../portals/LoginPage';
import AccessDeniedPage from '../portals/AccessDeniedPage';
import SuperAdminLayout from '../portals/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from '../portals/SuperAdmin/Dashboard';
import InstitutesList from '../portals/SuperAdmin/InstitutesList';
import InstituteCreate from '../portals/SuperAdmin/InstituteCreate';
import PlansList from '../portals/SuperAdmin/PlansList';
import InvoicesList from '../portals/SuperAdmin/InvoicesList';
import TicketsList from '../portals/SuperAdmin/TicketsList';
import InstituteAdminLayout from '../portals/InstituteAdmin/InstituteAdminLayout';
import InstituteAdminDashboard from '../portals/InstituteAdmin/Dashboard';
import AcademicSetup from '../portals/InstituteAdmin/AcademicSetup';
import StudentsList from '../portals/InstituteAdmin/StudentsList';
import TeachersList from '../portals/InstituteAdmin/TeachersList';
import ExamsPage from '../portals/InstituteAdmin/ExamsPage';
import ResultsPage from '../portals/InstituteAdmin/ResultsPage';
import AttendancePage from '../portals/InstituteAdmin/AttendancePage';
import FeesPage from '../portals/InstituteAdmin/FeesPage';
import SubscriptionPage from '../portals/InstituteAdmin/SubscriptionPage';
import TicketsPage from '../portals/InstituteAdmin/TicketsPage';
import TeacherLayout from '../portals/Teacher/TeacherLayout';
import TeacherDashboard from '../portals/Teacher/Dashboard';
import TeacherClasses from '../portals/Teacher/Classes';
import TeacherAttendance from '../portals/Teacher/Attendance';
import TeacherMarks from '../portals/Teacher/Marks';
import TeacherStudents from '../portals/Teacher/Students';
import StudentLayout from '../portals/Student/StudentLayout';
import StudentDashboard from '../portals/Student/Dashboard';
import StudentProfile from '../portals/Student/Profile';
import StudentResults from '../portals/Student/Results';
import StudentAttendance from '../portals/Student/Attendance';
import StudentFees from '../portals/Student/Fees';
import StudentTimetable from '../portals/Student/Timetable';
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
        <Route path="academic" element={<AcademicSetup />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="teachers" element={<TeachersList />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="tickets" element={<TicketsPage />} />
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
