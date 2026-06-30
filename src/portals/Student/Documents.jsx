import PageTitle from '../../components/layout/PageTitle';
import DocumentManager from '../../components/documents/DocumentManager';

export default function StudentDocuments() {
  return (
    <>
      <PageTitle title="My Documents" subtitle="Upload CNIC, certificates, transcripts, and other files" />
      <DocumentManager personType="student" mode="portal" />
    </>
  );
}
