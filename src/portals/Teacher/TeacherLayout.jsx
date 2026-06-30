import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper, { Sidebar } from '../../components/layout/PageWrapper';
import { TEACHER_SIDEBAR_LINKS } from './sidebarLinks';

export default function TeacherLayout() {
  const { user } = useSelector((s) => s.auth);
  const title = user?.instituteName || 'Teacher Portal';

  return (
    <PageWrapper sidebar={<Sidebar links={TEACHER_SIDEBAR_LINKS} title={title} />}>
      <Outlet />
    </PageWrapper>
  );
}
