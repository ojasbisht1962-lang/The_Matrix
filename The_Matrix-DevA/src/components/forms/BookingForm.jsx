// ============================================
// BookingForm — DevC
// React Hook Form + Zod for booking a resource
// Shows existing bookings for the selected asset as conflict hints
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema } from '../../lib/validators';
import {
  listBookableAssets,
  getAssetBookings,
} from '../../services/bookings.service';
import { Input, Select, Button, Spinner } from '../ui';
import { toast } from 'sonner';
import { Clock, Info } from 'lucide-react';
import styles from './BookingForm.module.css';

export function BookingForm({ onSubmit, onCancel, preselectedAssetId }) {
  const [bookableAssets, setBookableAssets] = useState([]);
  const [assetBookings, setAssetBookings] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      asset_id:   preselectedAssetId || '',
      start_time: '',
      end_time:   '',
      notes:      '',
    },
  });

  const watchedAssetId = watch('asset_id');

  // Load bookable assets on mount
  useEffect(() => {
    async function load() {
      try {
        setLoadingAssets(true);
        const assets = await listBookableAssets();
        setBookableAssets(assets || []);
      } catch (err) {
        toast.error('Failed to load available resources');
      } finally {
        setLoadingAssets(false);
      }
    }
    load();
  }, []);

  // Load existing bookings when asset changes to show conflict hints
  useEffect(() => {
    if (!watchedAssetId) {
      setAssetBookings([]);
      return;
    }
    getAssetBookings(watchedAssetId)
      .then(setAssetBookings)
      .catch(() => setAssetBookings([]));
  }, [watchedAssetId]);

  const handleFormSubmit = async (values) => {
    await onSubmit(values);
  };

  if (loadingAssets) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="md" />
        <p>Loading bookable resources…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
      <Select
        label="Select Resource"
        placeholder="Choose a bookable resource"
        required
        options={bookableAssets.map((a) => ({
          value: a.id,
          label: `${a.name} [${a.asset_tag}]${a.location ? ` — ${a.location}` : ''}`,
        }))}
        error={errors.asset_id?.message}
        disabled={!!preselectedAssetId}
        {...register('asset_id')}
      />

      <div className={styles.timeGrid}>
        <Input
          label="Start Time"
          type="datetime-local"
          required
          error={errors.start_time?.message}
          {...register('start_time')}
        />
        <Input
          label="End Time"
          type="datetime-local"
          required
          error={errors.end_time?.message}
          {...register('end_time')}
        />
      </div>

      <Input
        label="Notes (optional)"
        placeholder="Purpose, special requirements…"
        error={errors.notes?.message}
        {...register('notes')}
      />

      {/* Existing bookings hint */}
      {assetBookings.length > 0 && (
        <div className={styles.existingBookings}>
          <div className={styles.existingHeader}>
            <Info size={14} />
            <span>Existing bookings for this resource (avoid overlaps)</span>
          </div>
          <ul className={styles.existingList}>
            {assetBookings.map((b) => (
              <li key={b.id} className={styles.existingItem}>
                <Clock size={12} />
                <span>
                  {new Date(b.start_time).toLocaleString()} &rarr;{' '}
                  {new Date(b.end_time).toLocaleString()}
                </span>
                <span className={styles.existingStatus}>{b.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
