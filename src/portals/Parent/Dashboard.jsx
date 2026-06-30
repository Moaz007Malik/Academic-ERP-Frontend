import PageWrapper, { Sidebar } from '../../components/layout/PageWrapper';

const sidebarLinks = [{ to: '/parent', label: 'Dashboard' }];

export default function ParentDashboard() {
  return (
    <PageWrapper title="Parent Portal" sidebar={<Sidebar links={sidebarLinks} title="Parent" />}>
      <p className="text-gray-500">Welcome to the Parent portal.</p>
    </PageWrapper>
  );
}
