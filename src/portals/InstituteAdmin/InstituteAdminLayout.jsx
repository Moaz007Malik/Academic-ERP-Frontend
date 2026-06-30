import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageWrapper, { Sidebar } from '../../components/layout/PageWrapper';
import { getAdminSidebarLinks } from './sidebarLinks';

export default function InstituteAdminLayout() {
  const { user } = useSelector((s) => s.auth);
  const links = getAdminSidebarLinks(user);
  const title = user?.instituteName || user?.institute?.name || 'Institute Admin';

  return (
    <PageWrapper sidebar={<Sidebar links={links} title={title} />}>
      <Outlet />
    </PageWrapper>
  );
}
