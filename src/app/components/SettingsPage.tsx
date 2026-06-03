import { useState, type ChangeEvent } from 'react';
import { apiUrl } from '@/utils/apiBase';

const MAX_USERNAME_LENGTH = 18;

interface SettingsPageProps {
  initialName: string;
  initialEmail: string;
  onUsernameChange?: (username: string) => void;
  onProfileImageChange?: (imageDataUrl: string) => void;
}

export function SettingsPage({ initialName, initialEmail, onUsernameChange, onProfileImageChange }: SettingsPageProps) {
  const [fullName, setFullName] = useState(initialName || 'User Name');
  const [email, setEmail] = useState(initialEmail || 'user@example.com');
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [enteredVerificationCode, setEnteredVerificationCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [profilePictureName, setProfilePictureName] = useState('');
  const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] = useState('');
  const [profilePictureMessage, setProfilePictureMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [notifySystemUpdates, setNotifySystemUpdates] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const inputClassName =
    'w-full max-w-xl bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow';
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canResetPassword =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    passwordsMatch;

  const getFriendlyEmailMessage = (message?: string) => {
    if (!message) return 'Something went wrong. Please try again.';
    const lower = message.toLowerCase();

    if (lower.includes('could not authenticate') || lower.includes('smtp error')) {
      return 'Unable to send verification code. Please check your email settings and try again.';
    }
    if (lower.includes('failed to send verification code')) {
      return 'Unable to send verification code right now. Please try again.';
    }
    if (lower.includes('invalid verification code')) {
      return 'Invalid verification code. Please check the code and try again.';
    }
    if (lower.includes('no active verification code')) {
      return 'No active verification code. Please request a new code.';
    }

    return message;
  };

  const handlePasswordReset = () => {
    if (!hasMinLength || confirmPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters.');
      return;
    }

    if (!passwordsMatch) {
      setPasswordMessage('Password does not match.');
      return;
    }

    setPasswordMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendVerificationCode = async () => {
    const isEmailFormatValid = /\S+@\S+\.\S+/.test(email);
    if (!isEmailFormatValid) {
      setEmailVerificationMessage('Please enter a valid email address first.');
      return;
    }

    try {
      setIsSendingCode(true);
      setEmailVerificationMessage('');

      const response = await fetch(apiUrl('/api/email/send-code.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setEmailVerificationMessage(getFriendlyEmailMessage(data.message));
        return;
      }

      setIsVerificationCodeSent(true);
      setEnteredVerificationCode('');
      setIsEmailVerified(false);
      setEmailVerificationMessage(data.message || 'Verification code sent to your email.');
    } catch {
      setEmailVerificationMessage('Unable to connect to verification server.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isVerificationCodeSent) {
      setEmailVerificationMessage('Please send a verification code first.');
      return;
    }

    if (!/^\d{6}$/.test(enteredVerificationCode.trim())) {
      setEmailVerificationMessage('Code must be a 6-digit number.');
      return;
    }

    try {
      setIsVerifyingEmail(true);
      setEmailVerificationMessage('');

      const response = await fetch(apiUrl('/api/email/verify-code.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: enteredVerificationCode }),
      });

      const data = (await response.json()) as { message?: string; verified?: boolean };
      if (!response.ok || !data.verified) {
        setEmailVerificationMessage(getFriendlyEmailMessage(data.message));
        return;
      }

      setIsEmailVerified(true);
      setEmailVerificationMessage(data.message || 'Email verified successfully.');
      setIsVerificationCodeSent(false);
      setEnteredVerificationCode('');
    } catch {
      setEmailVerificationMessage('Unable to connect to verification server.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setProfilePictureName('');
      setProfilePictureMessage('');
      setProfilePicturePreviewUrl('');
      onProfileImageChange?.('');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setProfilePictureMessage('Please choose an image file only.');
      setProfilePictureName('');
      setProfilePicturePreviewUrl('');
      e.target.value = '';
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setProfilePictureMessage('Image is too large. Maximum size is 2MB.');
      setProfilePictureName('');
      setProfilePicturePreviewUrl('');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      setProfilePictureMessage('Profile picture selected.');
      setProfilePictureName(selectedFile.name);
      setProfilePicturePreviewUrl(imageDataUrl);
      onProfileImageChange?.(imageDataUrl);
    };
    reader.onerror = () => {
      setProfilePictureMessage('Unable to read this file. Please try another image.');
      setProfilePictureName('');
      setProfilePicturePreviewUrl('');
      onProfileImageChange?.('');
      e.target.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl">Profile Section</h2>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">User Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              const value = e.target.value.slice(0, MAX_USERNAME_LENGTH);
              setFullName(value);
              onUsernameChange?.(value);
            }}
            maxLength={MAX_USERNAME_LENGTH}
            className={inputClassName}
            placeholder="User Name"
          />
          <p className="text-xs text-muted-foreground">
            Up to {MAX_USERNAME_LENGTH} characters.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Email Address</label>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailVerified(false);
                setIsVerificationCodeSent(false);
                setEnteredVerificationCode('');
                setEmailVerificationMessage('');
              }}
              readOnly={!isEmailEditable}
              className={`${inputClassName} read-only:opacity-70`}
              placeholder="Email address"
            />
            <button
              type="button"
              onClick={() => setIsEmailEditable((prev) => !prev)}
              className="px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors"
            >
              {isEmailEditable ? 'Lock Email' : 'Change Email'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Email Verification Status:</span>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              isEmailVerified ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isEmailVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>

        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={isSendingCode}
              className="px-4 py-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSendingCode ? 'Sending...' : 'Send Verification Code'}
            </button>

            {!isEmailVerified && (
              <>
                <input
                  type="text"
                  value={enteredVerificationCode}
                  onChange={(e) => setEnteredVerificationCode(e.target.value)}
                  className="bg-background px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="Enter 6-digit code"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={isVerifyingEmail}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isVerifyingEmail ? 'Verifying...' : 'Verify Email'}
                </button>
              </>
            )}
          </div>

          {emailVerificationMessage && (
            <p
              className={`text-sm ${
                emailVerificationMessage.includes('successfully') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {emailVerificationMessage}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Profile Picture (optional upload)</label>
          <div className="max-w-xl rounded-lg border border-border bg-background/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="profile-picture-upload"
                className="inline-flex cursor-pointer items-center rounded-md bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
              >
                Choose File
              </label>
              <span className="text-sm text-muted-foreground">
                {profilePictureName || 'No file chosen'}
              </span>
            </div>
            <input
              id="profile-picture-upload"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
            {profilePicturePreviewUrl && (
              <img
                src={profilePicturePreviewUrl}
                alt="Profile preview"
                className="size-20 rounded-full object-cover border border-border"
              />
            )}
            {profilePictureMessage && (
              <p className={`text-xs ${profilePictureMessage.includes('selected') ? 'text-primary' : 'text-destructive'}`}>
                {profilePictureMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl">Security Section</h2>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Current Password</label>
          <div className="w-full max-w-xl relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordMessage('');
              }}
              className={`${inputClassName} max-w-none pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
            >
              {showCurrentPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">New Password</label>
          <div className="w-full max-w-xl relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordMessage('');
              }}
              className={`${inputClassName} max-w-none pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
            >
              {showNewPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">Confirm Password</label>
          <div className="w-full max-w-xl relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordMessage('');
              }}
              className={`${inputClassName} max-w-none pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="text-xs space-y-1">
            <p className={`flex items-center justify-between ${hasMinLength ? 'text-primary' : 'text-muted-foreground'}`}>
              <span>At least 8 characters</span>
              <span>{hasMinLength ? '✓' : ''}</span>
            </p>
            {confirmPassword.length > 0 && (
              <p className={`flex items-center justify-between ${passwordsMatch ? 'text-primary' : 'text-destructive'}`}>
                <span>{passwordsMatch ? 'Password match' : 'Password is not match'}</span>
                <span>{passwordsMatch ? '✓' : ''}</span>
              </p>
            )}
          </div>
        </div>

        <div className="w-full max-w-xl flex items-center gap-3">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={!canResetPassword}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Reset Password
          </button>
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.includes('success') ? 'text-primary' : 'text-destructive'}`}>
              {passwordMessage}
            </p>
          )}
        </div>

      </section>

      {/* Notifications Section */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 className="text-xl">Notifications Section</h2>

        <div className="space-y-3 max-w-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">System Updates</span>
            <input
              type="checkbox"
              checked={notifySystemUpdates}
              onChange={(e) => setNotifySystemUpdates(e.target.checked)}
              className="size-4 accent-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reports</span>
            <input
              type="checkbox"
              checked={notifyReports}
              onChange={(e) => setNotifyReports(e.target.checked)}
              className="size-4 accent-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Alerts</span>
            <input
              type="checkbox"
              checked={notifyAlerts}
              onChange={(e) => setNotifyAlerts(e.target.checked)}
              className="size-4 accent-primary"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
