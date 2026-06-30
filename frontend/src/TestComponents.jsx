import React, { useState } from 'react';
import { Home, Package, Truck, Users, Settings, Activity } from 'lucide-react';
import { 
  Sidebar, 
  TopBar, 
  StatCard, 
  DataTable, 
  StatusBadge, 
  Modal, 
  FormInput, 
  SelectDropdown, 
  ToastProvider, 
  useToast, 
  PageHeader, 
  OrderLifecycleTracker, 
  EmptyState 
} from './components/shared';

const TestContent = () => {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [multiSelectValue, setMultiSelectValue] = useState([]);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'Vendors', path: '/vendors', icon: Truck },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const tableColumns = [
    { label: 'Tracking ID', key: 'trackingId', sortable: true },
    { label: 'Customer', key: 'customer', sortable: true },
    { label: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  const tableData = [
    { id: 1, trackingId: 'CZ202411230001', customer: 'John Doe', status: 'Booked' },
    { id: 2, trackingId: 'CZ202411230002', customer: 'Jane Smith', status: 'In Transit' },
    { id: 3, trackingId: 'CZ202411230003', customer: 'Bob Brown', status: 'Delivered' },
  ];

  return (
    <div className="flex h-screen bg-cz-dark-bg text-cz-text-primary overflow-hidden w-full">
      <Sidebar 
        navItems={navItems} 
        activeRoute="/" 
        userName="Super Admin" 
        userRole="super_admin" 
        onLogout={() => console.log('logout')} 
      />
      
      <div className="flex-1 flex flex-col lg:ml-60 transition-all duration-300 w-full">
        <TopBar title="Component Playground" breadcrumb="Home / Components" />
        
        <main className="flex-1 overflow-y-auto p-6 mt-16 pb-20">
          <PageHeader 
            title="Shared Components" 
            subtitle="Testing all 12 shared components" 
            actionLabel="Trigger Toast" 
            onAction={() => addToast('This is a success toast!', 'success')} 
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Orders" value="1,234" delta={5.2} icon={Activity} color="#3b82f6" />
            <StatCard title="Active Vendors" value="42" delta={-2.1} icon={Truck} color="#f97316" />
            <StatCard title="Loading Stat" loading={true} />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-cz-border pb-2">Form Controls & Modal</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <FormInput 
                label="Sample Input" 
                placeholder="Type here..." 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                className="w-full sm:w-1/3"
              />
              <div className="w-full sm:w-1/3">
                <SelectDropdown 
                  label="Single Select" 
                  options={[{label: 'Option 1', value: '1'}, {label: 'Option 2', value: '2'}]} 
                  value={selectValue} 
                  onChange={setSelectValue} 
                />
              </div>
              <div className="w-full sm:w-1/3">
                <SelectDropdown 
                  label="Multi Select (Searchable)" 
                  options={[{label: 'Apple', value: 'apple'}, {label: 'Banana', value: 'banana'}, {label: 'Cherry', value: 'cherry'}]} 
                  value={multiSelectValue} 
                  onChange={setMultiSelectValue} 
                  multi 
                  searchable 
                />
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-cz-nav-bg border border-cz-border text-white px-4 py-2 rounded hover:bg-white/5"
            >
              Open Modal
            </button>
            <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              title="Test Modal"
              footer={<button onClick={() => setIsModalOpen(false)} className="bg-cz-accent-orange text-white px-4 py-2 rounded">Close</button>}
            >
              <p>This is the modal body content.</p>
            </Modal>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-cz-border pb-2">Order Lifecycle Tracker</h2>
            <OrderLifecycleTracker currentStatus="In Transit" />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-cz-border pb-2">Data Table</h2>
            <DataTable 
              columns={tableColumns} 
              data={tableData} 
              searchable 
              checkboxes 
              actions={<button className="bg-cz-accent-orange text-white px-4 py-2 rounded text-sm">Add New</button>}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b border-cz-border pb-2">Empty State</h2>
            <div className="bg-cz-card-bg border border-cz-border rounded-xl">
              <EmptyState 
                icon={Package} 
                title="No orders yet" 
                description="When you receive orders, they will appear here." 
                actionLabel="Create Order" 
                onAction={() => addToast('Create order clicked', 'info')}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function TestComponents() {
  return (
    <ToastProvider>
      <TestContent />
    </ToastProvider>
  );
}
