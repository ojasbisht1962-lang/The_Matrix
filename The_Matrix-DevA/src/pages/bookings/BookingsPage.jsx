// ============================================
// BookingsPage — DevC  (Screen 6)
// Resource Bookings: list view + create new booking
// Tabs: My Bookings | All Bookings (managers)
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  listBookings,
  bookResource,
  cancelBooking,
} from '../../services/bookings.service';
import { useAuth } from '../../hooks/useAuth';
import { canRegisterAsset } from '../../lib/permissions';
import { BOOKING_STATUSES, STATUS_COLORS } from '../../lib/constants';
import {
  PageHeader,
  Tabs,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Modal,
  EmptyState,
  Spinner,
  SearchBar,
} from '../../components/ui';
import { BookingForm } from '../../components/forms/BookingForm';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Ban,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './BookingsPage.module.css';

// ─── helpers ────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour:   '2-digit',
    minute: '2-digit',
  });

const durationHrs = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return (diff / 3_600_000).toFixed(1);
};

// ─── component ──────────────────────────────────────────────
export default function BookingsPage() {
  const { role, profile } = useAuth();
  const isManager = canRegisterAsset(role); // asset_manager+

  const [activeTab,   setActiveTab]   = useState('mine');
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const filters = activeTab === 'mine' ? { userId: profile?.id } : {};
      const data    = await listBookings(filters);
      setBookings(data || []);
    } catch (err) {
      toast.error('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, profile?.id]);

  useEffect(() => {
    if (profile?.id) loadBookings();
  }, [loadBookings, profile?.id]);

  // Client-side search
  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.asset?.name?.toLowerCase().includes(q) ||
      b.asset?.asset_tag?.toLowerCase().includes(q) ||
      b.booker?.full_name?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q)
    );
  });

  const handleBookSubmit = async (values) => {
    try {
      await bookResource({
        assetId:   values.asset_id,
        startTime: values.start_time,
        endTime:   values.end_time,
        notes:     values.notes,
      });
      toast.success('Booking confirmed!');
      setIsModalOpen(false);
      loadBookings();
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled');
      loadBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  const canCancel = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    // Own booking or manager
    return booking.booked_by === profile?.id || isManager;
  };

  const tabs = [
    { key: 'mine', label: 'My Bookings', icon: <Calendar size={16} /> },
    ...(isManager
      ? [{ key: 'all', label: 'All Bookings', icon: <CalendarDays size={16} /> }]
      : []),
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Resource Bookings"
        subtitle="Schedule and manage workspace, equipment, or asset time slots"
        actions={
          <Button
            variant="primary"
            iconLeft={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            New Booking
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search resource, tag, user…"
          className={styles.search}
        />
      </div>

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab}>
        {loading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={40} />}
            title="No bookings found"
            description={
              activeTab === 'mine'
                ? 'You have not booked any resources yet. Click New Booking to schedule one.'
                : 'No bookings match your search.'
            }
          />
        ) : (
          <div className={styles.bookingGrid}>
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showUser={activeTab === 'all'}
                canCancel={canCancel(booking)}
                onCancel={() => handleCancel(booking.id)}
              />
            ))}
          </div>
        )}
      </Tabs>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Book a Resource"
        size="md"
      >
        <BookingForm
          onSubmit={handleBookSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// ─── BookingCard ─────────────────────────────────────────────
function BookingCard({ booking, showUser, canCancel, onCancel }) {
  const statusVariant = STATUS_COLORS[booking.status] || 'neutral';
  const isPast =
    booking.status === 'completed' || booking.status === 'cancelled';

  return (
    <Card className={[styles.bookingCard, isPast ? styles.pastCard : ''].join(' ')}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.assetName}>{booking.asset?.name}</span>
          <Badge variant={statusVariant} dot>
            {booking.status}
          </Badge>
        </div>
        <span className={styles.assetTag}>{booking.asset?.asset_tag}</span>
      </CardHeader>

      <CardBody className={styles.cardBody}>
        <div className={styles.timeBlock}>
          <div className={styles.timeRow}>
            <Calendar size={14} className={styles.timeIcon} />
            <span>{fmtDate(booking.start_time)}</span>
          </div>
          <div className={styles.timeRow}>
            <Clock size={14} className={styles.timeIcon} />
            <span>
              {fmtTime(booking.start_time)} – {fmtTime(booking.end_time)}
              <span className={styles.duration}>
                &nbsp;({durationHrs(booking.start_time, booking.end_time)}h)
              </span>
            </span>
          </div>
          {booking.asset?.location && (
            <div className={styles.timeRow}>
              <MapPin size={14} className={styles.timeIcon} />
              <span>{booking.asset.location}</span>
            </div>
          )}
        </div>

        {showUser && (
          <p className={styles.bookerLine}>
            Booked by <strong>{booking.booker?.full_name}</strong>
          </p>
        )}

        {booking.notes && (
          <p className={styles.notes}>{booking.notes}</p>
        )}

        {canCancel && (
          <div className={styles.cardActions}>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Ban size={14} />}
              onClick={onCancel}
              className={styles.cancelBtn}
            >
              Cancel Booking
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
