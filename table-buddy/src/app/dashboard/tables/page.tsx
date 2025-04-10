'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/layout/PageContainer';
import { PlusIcon } from '@heroicons/react/24/outline';
import AddTableModal from '@/components/tables/AddTableModal';
import TableCard from '@/components/tables/TableCard';
import type { TableFormData } from '@/components/tables/AddTableModal';
import { toast } from 'react-hot-toast';
import { useGetTablesQuery, useCreateTableMutation, useDeleteTableMutation, useUpdateTableMutation } from '@/store/api/tablesApi';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface Table {
  id: number;
  name: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  attributes?: string;
}

export default function TablesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Redux hooks
  const { data: tables = [], isLoading, error } = useGetTablesQuery(undefined, {
    selectFromResult: ({ data, isLoading, error }) => ({
      data,
      isLoading,
      error: error as FetchBaseQueryError | SerializedError | undefined
    })
  });
  const [createTable] = useCreateTableMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();

  const handleAddTable = async (data: TableFormData) => {
    try {
      await createTable({
        name: data.tableNumber,
        section: data.section,
        capacity: data.capacity,
        attributes: data.attributes.join(','),
        status: data.isAvailable ? 'available' : 'occupied',
      }).unwrap();

      setIsAddModalOpen(false);
      toast.success('Table created successfully');
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
    }
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setIsEditModalOpen(true);
  };

  const handleUpdateTable = async (data: TableFormData) => {
    if (!selectedTable) return;

    try {
      await updateTable({
        id: selectedTable.id,
        name: data.tableNumber,
        section: data.section,
        capacity: data.capacity,
        attributes: data.attributes.join(','),
        status: data.isAvailable ? 'available' : 'occupied',
      }).unwrap();

      setIsEditModalOpen(false);
      setSelectedTable(null);
      toast.success('Table updated successfully');
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table');
    }
  };

  const handleDeleteTable = (table: Table) => {
    setSelectedTable(table);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTable) return;

    try {
      await deleteTable(selectedTable.id).unwrap();
      setIsDeleteModalOpen(false);
      setSelectedTable(null);
      toast.success('Table deleted successfully');
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer title="Tables" description="Manage your restaurant tables">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading tables...</div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageContainer title="Tables" description="Manage your restaurant tables">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error loading tables. Please try again later.</div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }
  console.log(tables);
  return (
    <DashboardLayout>
      <PageContainer
        title="Tables"
        description="Manage your restaurant tables"
      >
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-[#0F172A] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            <PlusIcon className="h-5 w-5" />
            Add Table
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table: Table) => (
            <TableCard
              key={table.id}
              {...table}
              attributes={table.attributes ? table.attributes.split(',') : []}
              onEdit={() => handleEditTable(table)}
              onDelete={() => handleDeleteTable(table)}
            />
          ))}
        </div>

        <AddTableModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTable}
        />

        <AddTableModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTable(null);
          }}
          onSubmit={handleUpdateTable}
          initialData={selectedTable ? {
            tableNumber: selectedTable.name,
            section: selectedTable.section,
            capacity: selectedTable.capacity,
            attributes: selectedTable.attributes ? selectedTable.attributes.split(',') : [],
            isAvailable: selectedTable.status === 'available',
          } : undefined}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTable(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Table"
          message={`Are you sure you want to delete table "${selectedTable?.name}"? This action cannot be undone.`}
        />
      </PageContainer>
    </DashboardLayout>
  );
} 