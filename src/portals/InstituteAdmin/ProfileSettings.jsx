import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api, { setAccessToken } from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import { logout, fetchMe } from '../../features/auth/authSlice';
import PasswordRequirements from '../../components/common/PasswordRequirements';
import { checkPasswordStrength } from '../../utils/passwordPolicy';

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [passwordForm, setPasswordForm] = useState({});
  const [message, setMessage] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef(null);
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
      const { logo, ...rest } = profile;
      await api.put('/admin/settings', rest);
      setMessage('Institute profile saved.');
    });
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file (PNG, JPG, or WebP).');
      return;
    }
    setLogoUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newLogo = data.data.logo;
      setProfile((p) => ({ ...p, logo: newLogo }));
      setMessage('Logo updated successfully.');
      await dispatch(fetchMe());
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');

    const strength = checkPasswordStrength(passwordForm.newPassword);
    if (!strength.valid) {
      setPwMessage('Please meet all password requirements listed below.');
      return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({});
      setAccessToken(null);
      await dispatch(logout());
      navigate('/login', { replace: true, state: { message: 'Password changed successfully. Please sign in with your new password.' } });
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Institute Logo</label>
            <div className="flex items-center gap-4">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt="Institute logo"
                  className="h-20 w-20 rounded-xl border border-gray-200 object-contain bg-gray-50"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                  No logo
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={uploadLogo}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={logoUploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoUploading ? 'Uploading...' : profile.logo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG or WebP · max 10MB</p>
              </div>
            </div>
          </div>

          <Input label="Institute Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3}
              value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          {message && <p className={`text-sm ${message.includes('success') || message.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Profile'}</Button>
        </form>

        <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <Input label="Current Password" type="password" value={passwordForm.current || ''}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required />
          <Input label="New Password" type="password" value={passwordForm.newPassword || ''}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
          <PasswordRequirements password={passwordForm.newPassword || ''} />
          {pwMessage && <p className={`text-sm ${pwMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMessage}</p>}
          <Button type="submit" disabled={!checkPasswordStrength(passwordForm.newPassword || '').valid}>
            Update Password
          </Button>
        </form>
      </div>
    </>
  );
}
