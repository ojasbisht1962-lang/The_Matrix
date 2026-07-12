// ============================================
// MaintenanceForm — DevC
// Raise a new maintenance request; optional photo upload
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceSchema } from '../../lib/validators';
import { listAssets } from '../../services/assets.service';
import { uploadMaintenancePhoto } from '../../services/maintenance.service';
import { Input, Select, Button, Spinner } from '../ui';
import { toast } from 'sonner';
import { UploadCloud, Camera } from 'lucide-react';
import styles from './MaintenanceForm.module.css';

export function MaintenanceForm({ onSubmit, onCancel, preselectedAssetId }) {
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      asset_id:    preselectedAssetId || '',
      description: '',
      priority:    'medium',
    },
  });

  useEffect(() => {
    async function loadAssets() {
      try {
        setLoadingAssets(true);
        // All assets can have maintenance requests — not filtered by status
        const data = await listAssets({});
        setAssets(data || []);
      } catch (err) {
        toast.error('Failed to load assets');
      } finally {
        setLoadingAssets(false);
      }
    }
    loadAssets();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const url = await uploadMaintenancePhoto(file);
      setPhotoUrl(url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    await onSubmit({
      assetId:     values.asset_id,
      description: values.description,
      priority:    values.priority,
      photoUrl:    photoUrl || undefined,
    });
  };

  if (loadingAssets) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="md" />
        <p>Loading assets…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
      <Select
        label="Asset"
        placeholder="Select the asset that needs maintenance"
        required
        options={assets.map((a) => ({
          value: a.id,
          label: `${a.name} [${a.asset_tag}]`,
        }))}
        error={errors.asset_id?.message}
        disabled={!!preselectedAssetId}
        {...register('asset_id')}
      />

      <Input
        label="Description"
        placeholder="Describe the issue in detail…"
        required
        error={errors.description?.message}
        {...register('description')}
      />

      <Select
        label="Priority"
        options={[
          { value: 'low',      label: '🟢 Low' },
          { value: 'medium',   label: '🔵 Medium' },
          { value: 'high',     label: '🟠 High' },
          { value: 'critical', label: '🔴 Critical' },
        ]}
        error={errors.priority?.message}
        {...register('priority')}
      />

      {/* Photo upload */}
      <div className={styles.photoSection}>
        <span className={styles.photoLabel}>
          <Camera size={14} />
          Attach Photo (optional)
        </span>
        <div className={styles.photoRow}>
          {photoUrl && (
            <img src={photoUrl} alt="Issue preview" className={styles.photoPreview} />
          )}
          <label className={styles.uploadBtn}>
            {photoUploading ? <Spinner size="sm" /> : <UploadCloud size={16} />}
            <span>{photoUrl ? 'Replace' : 'Upload Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className={styles.fileInput}
              disabled={photoUploading}
            />
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
