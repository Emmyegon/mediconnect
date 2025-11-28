import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">HealthLink</h3>
            <p className="text-gray-600 text-sm">
              A comprehensive e-clinic and triage system that connects patients with healthcare providers 
              through intelligent symptom assessment and appointment management.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Patients</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/triage" className="hover:text-primary-600">Symptom Triage</a></li>
              <li><a href="/appointments" className="hover:text-primary-600">Book Appointment</a></li>
              <li><a href="/profile" className="hover:text-primary-600">My Profile</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Healthcare Providers</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/doctor/dashboard" className="hover:text-primary-600">Doctor Dashboard</a></li>
              <li><a href="/admin/dashboard" className="hover:text-primary-600">Admin Panel</a></li>
              <li><a href="/appointments" className="hover:text-primary-600">Manage Appointments</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2024 HealthLink. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <button className="text-sm text-gray-600 hover:text-primary-600">Privacy Policy</button>
              <button className="text-sm text-gray-600 hover:text-primary-600">Terms of Service</button>
              <button className="text-sm text-gray-600 hover:text-primary-600">Contact</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



