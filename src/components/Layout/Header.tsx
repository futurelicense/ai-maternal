import React from 'react';
import { BellIcon, LogOutIcon, MenuIcon, SearchIcon, UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
interface HeaderProps {
  toggleSidebar: () => void;
}
const Header: React.FC<HeaderProps> = ({
  toggleSidebar
}) => {
  const {
    setIsAuthenticated
  } = useData();
  const navigate = useNavigate();
  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/login');
  };
  return <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-3 h-16 shadow-sm">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none">
          <MenuIcon size={20} />
        </button>
        <div className="relative ml-6 md:ml-10">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon size={18} className="text-gray-400" />
          </span>
          <input type="text" placeholder="Search patients, reports..." className="py-2 pl-10 pr-4 w-full md:w-64 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none">
          <BellIcon size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
            3
          </span>
        </button>
        <div className="relative">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">
                Dr. Sarah Chen
              </span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon size={16} className="text-indigo-600" />
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none" title="Log out">
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;