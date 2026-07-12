// ============================================
// ForgotPasswordPage — Screen 1 (auth flow)
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Layers } from 'lucide-react';
import { z } from 'zod';
import { forgotPassword } from '../../services/auth.service';
import styles from './auth.module.css';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  async function onSubmit({ email }) {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message ?? 'Failed to send reset email');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob} style={{ '--hue': '220' }} />

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Layers size={24} strokeWidth={1.8} /></div>
          <span className={styles.logoText}>AssetFlow</span>
        </div>

        {sent ? (
          <>
            <h1 className={styles.heading}>Email sent</h1>
            <p className={styles.sub}>
              If <strong>{getValues('email')}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link to="/auth/login" className={styles.backLink}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className={styles.heading}>Reset password</h1>
            <p className={styles.sub}>Enter your email and we&apos;ll send a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="forgot-email" className={styles.label}>Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : (
                  <Mail size={16} />
                )}
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <Link to="/auth/login" className={styles.backLink}>
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
