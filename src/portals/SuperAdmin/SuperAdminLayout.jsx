import { Outlet } from 'react-router-dom';
import PageWrapper, { Sidebar } from '../../components/layout/PageWrapper';
import { SA_SIDEBAR_LINKS } from './sidebarLinks';

export default function SuperAdminLayout() {
  return (
    <PageWrapper sidebar={<Sidebar links={SA_SIDEBAR_LINKS} title="ERP Control" />}>
      <Outlet />
    </PageWrapper>
  );
}
