import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper, { Sidebar } from '../../components/layout/PageWrapper';
import { STUDENT_SIDEBAR_LINKS } from './sidebarLinks';

export default function StudentLayout() {
  const { user } = useSelector((s) => s.auth);
  const title = user?.instituteName || 'Student Portal';

  return (
    <PageWrapper sidebar={<Sidebar links={STUDENT_SIDEBAR_LINKS} title={title} />}>
      <Outlet />
    </PageWrapper>
  );
}
