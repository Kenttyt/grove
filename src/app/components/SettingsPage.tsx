import { useState, type ChangeEvent } from 'react';

const MAX_USERNAME_LENGTH = 18;

interface SettingsPageProps {
  initialName: string;
  onUsernameChange?: (username: string) => void;
  onProfileImageChange?: (imageDataUrl: string) => void;
}

export function SettingsPage({ initialName, onUsernameChange, onProfileImageChange }: SettingsPageProps) {
  const [fullName, setFullName] = useState(initialName || 'User Name');
  const [profilePictureName, setProfilePictureName] = useState('');
  const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] = useState('');
  const [profilePictureMessage, setProfilePictureMessage] = useState('');

  const inputClassName =
    'w-full max-w-xl bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow';

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
        <h2 className="text-xl">Profile</h2>

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
    </div>
  );
}
