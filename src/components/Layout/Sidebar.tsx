import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UploadIcon, LineChartIcon, UsersIcon, BarChart2Icon, MapIcon, FileTextIcon } from 'lucide-react';
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar
}) => {
  const location = useLocation();
  const navItems = [{
    name: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon size={20} />
  }, {
    name: 'Data Ingestion',
    path: '/data-ingestion',
    icon: <UploadIcon size={20} />
  }, {
    name: 'Predictive Analytics',
    path: '/predictive-analytics',
    icon: <LineChartIcon size={20} />
  }, {
    name: 'Digital Twins',
    path: '/digital-twins',
    icon: <UsersIcon size={20} />
  }, {
    name: 'Policy Simulation',
    path: '/policy-simulation',
    icon: <BarChart2Icon size={20} />
  }, {
    name: 'Resource Allocation',
    path: '/resource-allocation',
    icon: <MapIcon size={20} />
  }, {
    name: 'Reports',
    path: '/reports',
    icon: <FileTextIcon size={20} />
  }];
  return <div className={`bg-indigo-800 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          {isOpen ? <h1 className="text-xl font-bold">MaternalHealth AI</h1> : <h1 className="text-xl font-bold">MH</h1>}
        </div>
      </div>
      <nav className="mt-5">
        <ul>
          {navItems.map(item => <li key={item.path} className="mb-2">
              <Link to={item.path} className={`flex items-center px-4 py-3 text-sm hover:bg-indigo-700 ${location.pathname === item.path ? 'bg-indigo-900' : ''}`}>
                <span className="mr-4">{item.icon}</span>
                {isOpen && <span>{item.name}</span>}
              </Link>
            </li>)}
        </ul>
      </nav>
    </div>;
};
export default Sidebar;