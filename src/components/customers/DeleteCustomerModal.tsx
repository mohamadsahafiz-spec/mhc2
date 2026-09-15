import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Customer, Machine } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string) => void;
  customer: Customer | null;
  machines: Machine[];
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customer,
  machines
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  if (!customer) return null;

  const assignedMachines = machines.filter(
    (m) => m.customerId === customer.id || m.customerName === customer.name
  );
  const isBlocked = assignedMachines.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBlocked ? 'Customer Deletion Blocked' : `Delete Customer — ${customer.name}`}
    >
      <div className="space-y-4">
        {isBlocked ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Active Machine Allocation Detected</span>
            </div>
            <p className="text-xs text-amber-300 leading-relaxed">
              Cannot delete customer <strong>{customer.name}</strong> because{' '}
              <strong>{assignedMachines.length} machine{assignedMachines.length > 1 ? 's are' : ' is'}</strong> currently assigned to this account.
            </p>
            <div className="p-2 rounded bg-black/20 text-xs font-mono">
              Assigned: {assignedMachines.map((m) => m.machineNumber || m.model).join(', ')}
            </div>
            <p className="text-[11px] text-slate-400">
              Please transfer or delete all machines under this customer before deleting the account.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Are you sure you want to delete customer account <strong>{customer.name}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              This action will remove the customer and its associated facility configuration from the workspace. This action cannot be undone.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700/30">
          <Button variant="ghost" onClick={onClose}>
            {isBlocked ? 'Close' : 'Cancel'}
          </Button>
          {!isBlocked && (
            <Button
              variant="danger"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onConfirm(customer.id);
                onClose();
              }}
            >
              Delete Customer
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
