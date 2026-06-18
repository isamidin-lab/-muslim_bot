'use client';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, LogOut, Save, Phone, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...profile };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfileMsg('Профиль обновлён');
      } else {
        const err = await res.json();
        setProfileMsg(err.message || 'Ошибка сохранения');
      }
    } catch {
      setProfileMsg('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (passwords.newPass !== passwords.confirm) {
      setPasswordMsg('Пароли не совпадают');
      return;
    }
    if (passwords.newPass.length < 6) {
      setPasswordMsg('Пароль должен быть не менее 6 символов');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: passwords.newPass }),
      });
      if (res.ok) {
        setPasswordMsg('Пароль изменён');
        setPasswords({ current: '', newPass: '', confirm: '' });
      } else {
        const err = await res.json();
        setPasswordMsg(err.message || 'Ошибка');
      }
    } catch {
      setPasswordMsg('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Настройки профиля</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={18} />Личные данные</CardTitle>
          <CardDescription>Обновите информацию о себе</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileMsg && (
              <div className={`p-3 rounded-xl text-sm ${profileMsg.includes('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{profileMsg}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Имя</label>
                <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})}
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Фамилия</label>
                <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})}
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2"><Save size={16} />{saving ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield size={18} />Смена пароля</CardTitle>
          <CardDescription>Обновите пароль от аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMsg && (
              <div className={`p-3 rounded-xl text-sm ${passwordMsg.includes('Ошибка') || passwordMsg.includes('не совпадают') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{passwordMsg}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Новый пароль</label>
              <input type="password" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} minLength={6}
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Минимум 6 символов" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Подтвердите пароль</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Повторите пароль" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} variant="outline" className="gap-2"><Shield size={16} />{saving ? 'Сохранение...' : 'Изменить пароль'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone size={18} />Telegram</CardTitle>
          <CardDescription>Привязка Telegram аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.telegramId ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <CheckCircle size={20} className="text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Telegram привязан</p>
                <p className="text-sm text-emerald-600">@{user.telegramUsername || user.telegramId}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Привяжите Telegram для получения уведомлений и доступа к каналам</p>
              <Button variant="outline" className="gap-2" onClick={() => window.open('https://t.me/muslim_bot', '_blank')}>
                <Phone size={16} />Привязать Telegram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Информация об аккаунте</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Роль</p><p className="font-medium">{user?.role}</p></div>
            <div><p className="text-gray-500">Дата регистрации</p><p className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '—'}</p></div>
            <div><p className="text-gray-500">ID пользователя</p><p className="font-mono text-xs text-gray-400">{user?.id}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Опасная зона</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout} className="gap-2"><LogOut size={16} />Выйти из аккаунта</Button>
        </CardContent>
      </Card>
    </div>
  );
}
