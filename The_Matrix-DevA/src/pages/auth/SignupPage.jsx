// ============================================
// SignupPage — Screen 1 (auth flow)
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, Layers } from 'lucide-react';
import { signupSchema } from '../../lib/validators';
import { signUp } from '../../services/auth.service';
import styles from './auth.module.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema) });

  async function onSubmit({ fullName, email, password }) {
    try {
      await signUp(email, password, { full_name: fullName });
      setEmailSent(true);
    } catch (err) {
      toast.error(err.message ?? 'Sign up failed');
    }
  }

  if (emailSent) {
    return (
      <div className={styles.page}>
        <div className={styles.blob} style={{ '--hue': '240' }} />
        <div className={styles.card}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Layers size={24} strokeWidth={1.8} /></div>
            <span className={styles.logoText}>AssetFlow</span>
          </div>
          <h1 className={styles.heading}>Check your email</h1>
          <p className={styles.sub}>
            We sent a confirmation link. Open it to activate your account, then{' '}
            <Link to="/auth/login" className={styles.switchLink}>sign in</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob} style={{ '--hue': '240' }} />
      <div className={styles.blob} style={{ '--hue': '280', '--delay': '-3s', '--x': '65%', '--y': '60%' }} />

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Layers size={24} strokeWidth={1.8} /></div>
          <span className={styles.logoText}>AssetFlow</span>
        </div>

        <h1 className={styles.heading}>Create account</h1>
        <p className={styles.sub}>Join your organization on AssetFlow.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* Full name */}
          <div className={styles.field}>
            <label htmlFor="signup-name" className={styles.label}>Full name</label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
              placeholder="Jane Doe"
              {...register('fullName')}
            />
            {errors.fullName && <p className={styles.errorMsg}>{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>Work email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="jane@company.com"
              {...register('email')}
            />
            {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="signup-password" className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Min. 8 characters"
                {...register('password')}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className={styles.errorMsg}>{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div className={styles.field}>
            <label htmlFor="signup-confirm" className={styles.label}>Confirm password</label>
            <div className={styles.passwordWrap}>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Repeat password"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className={styles.errorMsg}>{errors.confirmPassword.message}</p>}
          </div>

          <button
            id="signup-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <UserPlus size={16} />
            )}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/auth/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
