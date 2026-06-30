import PageTitle from '../../components/layout/PageTitle';
import DocumentManager from '../../components/documents/DocumentManager';

export default function TeacherDocuments() {
  return (
    <>
      <PageTitle title="My Documents" subtitle="Upload degrees, CNIC, appointment letters, and other files" />
      <DocumentManager personType="teacher" mode="portal" />
    </>
  );
}
