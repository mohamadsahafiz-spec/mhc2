import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Cpu, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  FileText, 
  ArrowRightLeft,
  Calendar
} from 'lucide-react';
import { Customer, Plant, ProductionLine, Machine, Contract, MHCSession } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { CustomerModal } from '../customers/CustomerModal';
import { DeleteCustomerModal } from '../customers/DeleteCustomerModal';
import { CustomerHierarchyView } from '../customers/CustomerHierarchyView';
import { CustomerContractsView } from '../customers/CustomerContractsView';

interface CustomersPlantsProps {
  customers: Customer[];
  plants?: Plant[];
  lines?: ProductionLine[];
  machines: Machine[];
  contracts?: Contract[];
  mhcSessions?: MHCSession[];
  onSelectMachine: (machineId: string) => void;
  onOpenMhcHistory?: (machineId: string, sessionId?: string) => void;
  onAddCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onTransferMachine?: (
    machineId: string,
    transferData: {
      plantName: string;
      plantId: string;
      productionLineName: string;
      productionLineId: string;
      zone: string;
    }
  ) => void;
  onSaveContract?: (contract: Contract) => void;
  onOpenPlanner?: (contractId?: string) => void;
}

export const CustomersPlantsModule: React.FC<CustomersPlantsProps> = ({
  customers,
  plants = [],
  lines = [],
  machines,
  contracts = [],
  mhcSessions = [],
  onSelectMachine,
  onOpenMhcHistory,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onTransferMachine,
  onSaveContract,
  onOpenPlanner
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'contracts'>('infrastructure');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Active customer selection
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Filter customer list for search
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  });

  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setCustomerToEdit(c);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (customerData: Customer) => {
    if (customerToEdit) {
      if (onEditCustomer) onEditCustomer(customerData);
    } else {
      if (onAddCustomer) onAddCustomer(customerData);
      setSelectedCustomerId(customerData.id);
    }
  };

  const handleConfirmDeleteCustomer = (id: string) => {
    if (onDeleteCustomer) {
      onDeleteCustomer(id);
      const remaining = customers.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setSelectedCustomerId(remaining[0].id);
      } else {
        setSelectedCustomerId('');
      }
    }
  };

  const handleTransfer = (
    machineId: string,
    transferData: {
      plantName: string;
      plantId: string;
      productionLineName: string;
      productionLineId: string;
      zone: string;
    }
  ) => {
    if (onTransferMachine) {
      onTransferMachine(machineId, transferData);
    }
  };

  const handleSaveContractItem = (contractData: Contract) => {
    if (onSaveContract) {
      onSaveContract(contractData);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Fleet Top Bar & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer Operations & Fleet Workspace</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer cleanrooms, facility infrastructure hierarchies, machine asset transfers, and multi-year SLA contracts.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddCustomer}
        >
          Register Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        /* Empty State */
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <Building2 className="w-12 h-12 text-sky-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold">No Customer Accounts Registered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Register your first customer cleanroom account to manage facilities, production lines, and machine allocations.
          </p>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAddCustomer}>
            Register First Customer
          </Button>
        </div>
      ) : (
        /* Master-Detail Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer Accounts List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search customer accounts..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  isDark
                    ? 'bg-[#14171A] border-[#2B323A] text-slate-200 placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomer?.id;
                const custMachines = machines.filter(
                  (m) => m.customerId === cust.id || m.customerName === cust.name
                );
                const uniquePlants = new Set(custMachines.map((m) => m.plantName).filter(Boolean)).size;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-[#181C20] border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                          : 'bg-sky-50/70 border-sky-400 shadow-md ring-1 ring-sky-300'
                        : isDark
                        ? 'bg-[#14171A] border-[#2B323A] hover:border-slate-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-100">{cust.name}</span>
                        </div>
                        {cust.industry ? (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {cust.industry}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">Facility unspecified</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {custMachines.length} Machine{custMachines.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Customer Detail Workspace */}
          {selectedCustomer && (
            <div className="lg:col-span-8 space-y-5">
              {/* Customer Identity Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-100">{selectedCustomer.name}</h3>
                      <Badge variant="cyan" size="sm">
                        {selectedCustomer.industry || 'Cleanroom Account'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{selectedCustomer.contactPerson || 'No contact recorded'}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setCustomerToDelete(selectedCustomer)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Sub-view Navigation Tabs */}
                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => setActiveTab('infrastructure')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'infrastructure'
                        ? isDark
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Cleanroom Hierarchy & Fleet</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('contracts')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'contracts'
                        ? isDark
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-sky-100 text-sky-800 border border-sky-300'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>SLA Contracts & Timeline</span>
                  </button>
                </div>
              </div>

              {/* Sub-view Contents */}
              {activeTab === 'infrastructure' ? (
                <CustomerHierarchyView
                  customer={selectedCustomer}
                  machines={machines}
                  onSelectMachine={onSelectMachine}
                  onOpenMhcHistory={onOpenMhcHistory}
                  onTransferMachine={handleTransfer}
                />
              ) : (
                <CustomerContractsView
                  customer={selectedCustomer}
                  contracts={contracts}
                  customerMachines={machines.filter(
                    (m) => m.customerId === selectedCustomer.id || m.customerName === selectedCustomer.name
                  )}
                  mhcSessions={mhcSessions}
                  onSaveContract={handleSaveContractItem}
                  onOpenMhcSession={onOpenMhcHistory}
                  onOpenPlanner={onOpenPlanner}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleSaveCustomer}
          customerToEdit={customerToEdit}
        />
      )}

      {/* Delete Customer Modal */}
      {customerToDelete && (
        <DeleteCustomerModal
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={handleConfirmDeleteCustomer}
          customer={customerToDelete}
          machines={machines}
        />
      )}
    </div>
  );
};
