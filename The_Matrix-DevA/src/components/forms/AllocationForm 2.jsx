// ============================================
// AllocationForm — allocate an asset to an employee
// Handles lookups for available assets and profiles
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { allocationSchema } from '../../lib/validators';
import { supabase } from '../../supabase';
import { listAssets } from '../../services/assets.service';
import { Input, Select, Button, Spinner } from '../ui';
import { toast } from 'sonner';
import styles from './AllocationForm.module.css';

export function AllocationForm({ onSubmit, onCancel, preselectedAssetId }) {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      asset_id: preselectedAssetId || '',
      to_user_id: '',
      expected_return: '',
      notes: '',
    },
  });

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoading(true);

        // Fetch available assets
        const assets = await listAssets({ status: 'available' });
        setAvailableAssets(assets || []);

        // Fetch profiles/employees
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('status', 'active')
          .order('full_name');

        if (profError) throw profError;
        setEmployees(profiles || []);
      } catch (err) {
        toast.error('Failed to load allocation options');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLookups();
  }, []);

  const handleFormSubmit = async (values) => {
    // If expected_return is empty, map to null
    const finalValues = {
      ...values,
      expected_return: values.expected_return || null,
    };
    await onSubmit(finalValues);
  };

  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="md" />
        <p>Loading records...</p>
      </div>
    );
  }

  // If a preselected asset is passed, we might want to append it to available assets list
  // so the selection remains valid if it's not technically marked "available" right now (e.g. in transitional state)
  const assetOptions = availableAssets.map((a) => ({
    value: a.id,
    label: `${a.name} [${a.asset_tag}]`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
      <Select
        label="Select Asset"
        placeholder="Choose an available asset"
        options={assetOptions}
        required
        error={errors.asset_id?.message}
        {...register('asset_id')}
        disabled={!!preselectedAssetId}
      />

      <Select
        label="Assign to Employee"
        placeholder="Choose employee profile"
        options={employees.map((e) => ({
          value: e.id,
          label: `${e.full_name} (${e.email})`,
        }))}
        required
        error={errors.to_user_id?.message}
        {...register('to_user_id')}
      />

      <Input
        label="Expected Return Date"
        type="date"
        error={errors.expected_return?.message}
        {...register('expected_return')}
      />

      <Input
        label="Allocation Notes"
        placeholder="Reason for allocation, custom location, or notes"
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Allocate Asset
        </Button>
      </div>
    </form>
  );
}
