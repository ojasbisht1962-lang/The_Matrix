// ============================================
// LoginPage — Screen 1 (auth flow)
// ============================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Layers } from 'lucide-react';
import { loginSchema } from '../../lib/validators';
import { signIn } from '../../services/auth.service';
import styles from './auth.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit({ email, password }) {
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message ?? 'Sign in failed');
    }
  }

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob} style={{ '--hue': '240' }} />
      <div className={styles.blob} style={{ '--hue': '270', '--delay': '-4s', '--x': '60%', '--y': '70%' }} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <Layers size={24} strokeWidth={1.8} />
          </div>
          <span className={styles.logoText}>AssetFlow</span>
        </div>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.sub}>Manage assets, resources, and teams — all in one place.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="login-password" className={styles.label}>Password</label>
              <Link to="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            <div className={styles.passwordWrap}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="••••••••"
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

          <button
            id="login-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <LogIn size={16} />
            )}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link to="/auth/signup" className={styles.switchLink}>Create account</Link>
        </p>
      </div>
    </div>
  );
}
