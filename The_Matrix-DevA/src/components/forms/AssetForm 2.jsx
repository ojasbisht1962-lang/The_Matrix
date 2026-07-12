// ============================================
// AssetForm — Register/Edit asset form
// React Hook Form + Zod validation
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetSchema } from '../../lib/validators';
import { listCategories } from '../../services/categories.service';
import { listDepartments } from '../../services/departments.service';
import { uploadAssetPhoto } from '../../services/assets.service';
import { Input, Select, Button, Spinner } from '../ui';
import { toast } from 'sonner';
import { Image, UploadCloud } from 'lucide-react';
import styles from './AssetForm.module.css';

export function AssetForm({ asset, onSubmit, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(asset?.photo_url || '');

  const isEdit = !!asset;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name || '',
      category_id: asset?.category_id || '',
      serial_number: asset?.serial_number || '',
      acquisition_date: asset?.acquisition_date || '',
      acquisition_cost: asset?.acquisition_cost ? Number(asset.acquisition_cost) : null,
      condition: asset?.condition || 'new',
      location: asset?.location || '',
      department_id: asset?.department_id || '',
      is_bookable: asset?.is_bookable || false,
      custom_field_values: asset?.custom_field_values || {},
      photo_url: asset?.photo_url || '',
    },
  });

  // Fetch Lookups
  useEffect(() => {
    async function loadLookups() {
      try {
        setLoadingLookups(true);
        const [cats, depts] = await Promise.all([listCategories(), listDepartments()]);
        setCategories(cats || []);
        setDepartments(depts || []);
      } catch (err) {
        toast.error('Failed to load category/department lookups');
        console.error(err);
      } finally {
        setLoadingLookups(false);
      }
    }
    loadLookups();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoUploading(true);
      const url = await uploadAssetPhoto(file);
      setValue('photo_url', url);
      setPreviewPhotoUrl(url);
      toast.success('Asset photo uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
      console.error(err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLocalSubmit = async (values) => {
    // Convert acquisition_cost to number or null explicitly
    const cost = values.acquisition_cost ? Number(values.acquisition_cost) : null;
    const finalPayload = {
      ...values,
      acquisition_cost: cost,
      // If department_id is empty string, convert to null
      department_id: values.department_id || null,
    };
    await onSubmit(finalPayload);
  };

  if (loadingLookups) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="md" />
        <p>Loading metadata...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleLocalSubmit)} className={styles.form}>
      {/* Photo Upload Area */}
      <div className={styles.photoSection}>
        <div className={styles.photoContainer}>
          {previewPhotoUrl ? (
            <img src={previewPhotoUrl} alt="Asset preview" className={styles.previewImage} />
          ) : (
            <div className={styles.placeholderIcon}>
              <Image size={40} />
            </div>
          )}
          {photoUploading && (
            <div className={styles.photoOverlay}>
              <Spinner size="sm" />
            </div>
          )}
        </div>
        <label className={styles.uploadBtn}>
          <UploadCloud size={16} />
          <span>{isEdit ? 'Replace Photo' : 'Upload Photo'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className={styles.fileInput}
            disabled={photoUploading}
          />
        </label>
      </div>

      {/* Basic details */}
      <div className={styles.formGrid}>
        <Input
          label="Asset Name"
          placeholder="e.g. MacBook Pro 16"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Category"
          placeholder="Select category"
          required
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.category_id?.message}
          {...register('category_id')}
        />

        <Input
          label="Serial Number"
          placeholder="Serial or Service Tag"
          error={errors.serial_number?.message}
          {...register('serial_number')}
        />

        <Input
          label="Acquisition Date"
          type="date"
          error={errors.acquisition_date?.message}
          {...register('acquisition_date')}
        />

        <Input
          label="Acquisition Cost ($)"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.acquisition_cost?.message}
          {...register('acquisition_cost', { valueAsNumber: true })}
        />

        <Select
          label="Condition"
          options={[
            { value: 'new', label: 'New' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair' },
            { value: 'poor', label: 'Poor' },
          ]}
          error={errors.condition?.message}
          {...register('condition')}
        />

        <Input
          label="Location"
          placeholder="Building, Floor, Desk, Room"
          error={errors.location?.message}
          {...register('location')}
        />

        <Select
          label="Department"
          placeholder="Assign to Department (Optional)"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          error={errors.department_id?.message}
          {...register('department_id')}
        />
      </div>

      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register('is_bookable')} className={styles.checkbox} />
          <span>Mark as Bookable Resource (for desk/room/hardware checkouts)</span>
        </label>
      </div>

      {/* Actions */}
      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEdit ? 'Save Changes' : 'Register Asset'}
        </Button>
      </div>
    </form>
  );
}
