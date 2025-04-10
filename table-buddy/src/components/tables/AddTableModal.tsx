'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Dropdown from '@/components/ui/Dropdown';

export interface TableFormData {
  tableNumber: string;
  section: string;
  capacity: number;
  attributes: string[];
  isAvailable: boolean;
}

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TableFormData) => void;
  initialData?: TableFormData;
}

const sections = [
  'Main',
  'Window Section',
  'Bar Section',
  'Private Section'
];

const availableAttributes = [
  'Romantic',
  'Family-friendly',
  'Private',
  'Birthday',
  'High-top'
];

export default function AddTableModal({ isOpen, onClose, onSubmit, initialData }: AddTableModalProps) {
  const [formData, setFormData] = useState<TableFormData>({
    tableNumber: '',
    section: '',
    capacity: 2,
    attributes: [],
    isAvailable: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        tableNumber: '',
        section: '',
        capacity: 2,
        attributes: [],
        isAvailable: true,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAttributesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const attributes = e.target.value.split(',').map(attr => attr.trim()).filter(attr => attr);
    setFormData(prev => ({
      ...prev,
      attributes,
    }));
  };

  const inputClassName = "mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#00000099] bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {initialData ? 'Edit Table' : 'Add New Table'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700">
                          Table Number
                        </label>
                        <input
                          type="text"
                          name="tableNumber"
                          id="tableNumber"
                          value={formData.tableNumber}
                          onChange={handleInputChange}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                          Section
                        </label>
                        <select
                          name="section"
                          id="section"
                          value={formData.section}
                          onChange={handleInputChange}
                          className={inputClassName}
                          required
                        >
                          <option value="">Select a section</option>
                          <option value="Main Dining">Main Dining</option>
                          <option value="Patio">Patio</option>
                          <option value="Bar">Bar</option>
                          <option value="Private Room">Private Room</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                          Capacity
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          id="capacity"
                          min="1"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          className={inputClassName}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="attributes" className="block text-sm font-medium text-gray-700">
                          Attributes (comma-separated)
                        </label>
                        <textarea
                          name="attributes"
                          id="attributes"
                          rows={3}
                          value={formData.attributes.join(', ')}
                          onChange={handleAttributesChange}
                          className={inputClassName}
                          placeholder="e.g., window view, outdoor, high-top"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isAvailable"
                          id="isAvailable"
                          checked={formData.isAvailable}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                          Table is available
                        </label>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                          {initialData ? 'Update Table' : 'Add Table'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 