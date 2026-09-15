import React, { useState, useEffect } from 'react';
import { Building2, Save, X } from 'lucide-react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setIndustry(customerToEdit.industry || '');
      setContactPerson(customerToEdit.contactPerson || '');
      setEmail(customerToEdit.email || '');
      setPhone(customerToEdit.phone || '');
    } else {
      setName('');
      setIndustry('');
      setContactPerson('');
      setEmail('');
      setPhone('');
    }
    setError('');
  }, [customerToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    const customerData: Customer = {
      id: customerToEdit?.id || `cust-${Date.now()}`,
      name: name.trim(),
      industry: industry.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      plantsCount: customerToEdit?.plantsCount || 0,
      activeContractsCount: customerToEdit?.activeContractsCount || 0
    };

    onSave(customerData);
    onClose();
  };

  const inputClasses = `w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
    isDark
      ? 'bg-[#181C20] border-[#2B323A] text-slate-100 placeholder-slate-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1 uppercase tracking-wider ${
    isDark ? 'text-slate-400' : 'text-slate-600'
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? `Edit Customer — ${customerToEdit.name}` : 'Register New Customer Account'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className={labelClasses}>
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Semiconductor Corp"
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Industry / Operations Domain</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Advanced Wafer Packaging & Metrology"
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClasses}>Primary Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. John Doe (or leave blank)"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@domain.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0100"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700/30">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            {customerToEdit ? 'Update Customer' : 'Register Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
