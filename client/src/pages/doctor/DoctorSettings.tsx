import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DoctorProfile {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  experience: number;
  licenseNumber: string;
  consultationFee: number;
  qualifications: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  availability: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

const DoctorSettings: React.FC = () => {
  const [profile, setProfile] = useState<DoctorProfile>({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    experience: 0,
    licenseNumber: '',
    consultationFee: 0,
    qualifications: [],
    availability: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/profile');
      const data = response.data.data;
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        specialization: data.specialization || '',
        bio: data.bio || '',
        experience: data.experience || 0,
        licenseNumber: data.licenseNumber || '',
        consultationFee: data.consultationFee || 0,
        qualifications: data.qualifications || [],
        availability: data.availability || [],
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/doctor/profile', profile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    setProfile({
      ...profile,
      qualifications: [...profile.qualifications, { degree: '', institution: '', year: new Date().getFullYear() }],
    });
  };

  const updateQualification = (index: number, field: string, value: any) => {
    const updated = [...profile.qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, qualifications: updated });
  };

  const removeQualification = (index: number) => {
    setProfile({
      ...profile,
      qualifications: profile.qualifications.filter((_, i) => i !== index),
    });
  };

  const addAvailability = () => {
    setProfile({
      ...profile,
      availability: [...profile.availability, { day: 'Monday', startTime: '09:00', endTime: '17:00' }],
    });
  };

  const updateAvailability = (index: number, field: string, value: string) => {
    const updated = [...profile.availability];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, availability: updated });
  };

  const removeAvailability = (index: number) => {
    setProfile({
      ...profile,
      availability: profile.availability.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your professional profile and availability</p>
      </div>

      {/* Profile Picture */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-16 h-16 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-600">{profile.specialization}</p>
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Change Photo
            </button>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              type="text"
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input
              type="text"
              value={profile.licenseNumber}
              onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input
              type="number"
              value={profile.experience}
              onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
            <input
              type="number"
              value={profile.consultationFee}
              onChange={(e) => setProfile({ ...profile, consultationFee: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell patients about yourself, your expertise, and approach to care..."
          />
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Qualifications</h2>
          <button
            onClick={addQualification}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        <div className="space-y-4">
          {profile.qualifications.map((qual, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                <input
                  type="text"
                  value={qual.degree}
                  onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MBBS, MD, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={qual.institution}
                  onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="University name"
                />
              </div>
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={qual.year}
                    onChange={(e) => updateQualification(index, 'year', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => removeQualification(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {profile.qualifications.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No qualifications added yet</p>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Availability Schedule</h2>
          <button
            onClick={addAvailability}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        <div className="space-y-4">
          {profile.availability.map((avail, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={avail.day}
                  onChange={(e) => updateAvailability(index, 'day', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={avail.startTime}
                  onChange={(e) => updateAvailability(index, 'startTime', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={avail.endTime}
                  onChange={(e) => updateAvailability(index, 'endTime', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removeAvailability(index)}
                  className="w-full px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  <TrashIcon className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}

          {profile.availability.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No availability schedule set</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default DoctorSettings;
