import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({});
  const [passwordForm, setPasswordForm] = useState({});
  const [message, setMessage] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const { submitting, run } = useAsyncSubmit();

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      const inst = res.data.data;
      setProfile({
        name: inst.name || '',
        logo: inst.logo || '',
        address: inst.address || '',
        phone: inst.phone || '',
        email: inst.email || '',
        settings: inst.settings || {},
      });
    });
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    await run(async () => {
      await api.put('/admin/settings', profile);
      setMessage('Institute profile saved.');
    });
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPassword,
      });
      setPwMessage('Password changed successfully.');
      setPasswordForm({});
    } catch (err) {
      setPwMessage(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <>
      <PageTitle title="Profile Settings" subtitle="Institute profile, contact info, and security" />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Institute Profile</h2>
          <Input label="Institute Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Logo URL" value={profile.logo} onChange={(e) => setProfile({ ...profile, logo: e.target.value })} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3}
              value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Profile'}</Button>
        </form>

        <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <Input label="Current Password" type="password" value={passwordForm.current || ''}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required />
          <Input label="New Password" type="password" value={passwordForm.newPassword || ''}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
          {pwMessage && <p className={`text-sm ${pwMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMessage}</p>}
          <Button type="submit">Update Password</Button>
        </form>
      </div>
    </>
  );
}
