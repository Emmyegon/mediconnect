import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import {
  UserIcon,
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // For patients
  const patientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { 
      name: 'Video Consultation', 
      href: '/video-consultation',
      icon: VideoCameraIcon,
      children: [
        { name: 'Start New Call', href: '/call/start' },
        { name: 'Join Call', href: '/call/join' }
      ]
    },
    { name: 'Triage', href: '/triage', icon: ClipboardDocumentListIcon },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
  ];

  // For doctors
  const doctorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { 
      name: 'Video Consultation', 
      href: '/video-consultation',
      icon: VideoCameraIcon,
      children: [
        { name: 'Start New Call', href: '/call/start' },
        { name: 'Join Call', href: '/call/join' }
      ]
    },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
    { name: 'Patients', href: '/doctor/patients', icon: UserGroupIcon },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Cog6ToothIcon },
  ];

  const getNavigationItems = () => {
    if (!user) return patientNavigation;
    
    switch (user.role) {
      case 'doctor':
        return doctorNavigation;
      case 'admin':
        return [...patientNavigation, ...doctorNavigation, ...adminNavigation];
      default:
        return patientNavigation;
    }
  };

  const renderDesktopNavItem = (item: any) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = location.pathname === item.href || 
                    (item.children && item.children.some((child: any) => 
                      location.pathname === child.href
                    ));

    return (
      <div key={item.name} className="relative group">
        {hasChildren ? (
          <div
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
            onClick={() => toggleDropdown(item.name)}
          >
            <item.icon className="w-5 h-5 mr-2.5" />
            {item.name}
            <ChevronDownIcon
              className={`ml-1 w-4 h-4 transition-transform ${
                openDropdown === item.name ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        ) : (
          <Link
            to={item.href}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <item.icon className="w-5 h-5 mr-2.5" />
            {item.name}
          </Link>
        )}

        {hasChildren && (
          <div
            className={`absolute left-0 mt-1 w-56 rounded-xl shadow-lg bg-white ring-1 ring-gray-200 ring-opacity-50 focus:outline-none z-10 overflow-hidden transition-all duration-200 transform origin-top ${
              openDropdown === item.name 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="py-1.5">
              {item.children.map((child: any) => (
                <Link
                  key={child.name}
                  to={child.href}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors duration-200"
                  onClick={() => setOpenDropdown(null)}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileNavItem = (item: any) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = location.pathname === item.href;

    return (
      <div key={item.name} className="space-y-1">
        {hasChildren ? (
          <>
            <div
              className={`flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
              }`}
              onClick={() => toggleDropdown(item.name)}
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </div>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform ${
                  openDropdown === item.name ? 'transform rotate-180' : ''
                }`}
              />
            </div>
            {openDropdown === item.name && (
              <div className="pl-12 space-y-1">
                {item.children.map((child: any) => (
                  <Link
                    key={child.name}
                    to={child.href}
                    className="block px-4 py-2.5 text-base font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={item.href}
            className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    HealthLink
                  </h1>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity duration-200 shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  HealthLink
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {getNavigationItems().map((item) => renderDesktopNavItem(item))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center ml-2">
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50">
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium group-hover:opacity-90 transition-opacity">
                    {user?.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-gray-200 ring-opacity-50 focus:outline-none z-50 overflow-hidden">
                  <div className="py-1.5">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? 'bg-gray-50 text-primary' : 'text-gray-700'
                          } flex items-center px-4 py-2.5 text-sm transition-colors duration-200`}
                        >
                          <UserIcon className="w-4 h-4 mr-3 text-gray-500" />
                          My Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-50 text-red-600' : 'text-gray-700'
                          } flex items-center w-full px-4 py-2.5 text-sm text-left transition-colors duration-200`}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-gray-500" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-primary p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Transition
        show={mobileMenuOpen}
  enter="transition ease-out duration-100"
  enterFrom="opacity-0 -translate-y-2"
  enterTo="opacity-100 translate-y-0"
  leave="transition ease-in duration-75"
  leaveFrom="opacity-100 translate-y-0"
  leaveTo="opacity-0 -translate-y-2"
>
  <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100">
    <div className="px-2 pt-2 pb-4 space-y-1">
      {getNavigationItems().map((item) => renderMobileNavItem(item))}
      <div className="px-4 py-3 border-t border-gray-100 mt-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
              </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="block px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 mr-3" />
                My Profile
              </div>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center">
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Sign out
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar;