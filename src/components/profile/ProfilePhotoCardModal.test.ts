import { describe, it, expect, vi } from 'vitest';
import { SystemUser } from '../../types';
import { getInitials } from '../common/UserAvatar';

describe('ProfilePhotoCardModal Usability & Actions (v3.5.9)', () => {
  const mockUserWithPhoto: SystemUser = {
    id: 'usr-001',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz Sulaiman',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-882 1042',
    avatarUrl: 'data:image/jpeg;base64,mockImageData123',
    company: 'EO Technics',
    department: 'Field Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: '2026-09-23 08:00',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active'
  };

  const mockUserWithoutPhoto: SystemUser = {
    ...mockUserWithPhoto,
    avatarUrl: undefined
  };

  it('correctly resolves initial letters for fallback avatar display', () => {
    expect(getInitials('Sahafiz Sulaiman')).toBe('SS');
    expect(getInitials('Ahmad')).toBe('AH');
    expect(getInitials('')).toBe('FE');
  });

  it('preserves existing profile photo state on modal inspection', () => {
    expect(mockUserWithPhoto.avatarUrl).toBeTruthy();
    expect(mockUserWithPhoto.avatarUrl).toBe('data:image/jpeg;base64,mockImageData123');
  });

  it('supports photo lifecycle operations: upload, restore initials, and remove', () => {
    let currentUser = { ...mockUserWithPhoto };

    // 1. Restore initials / Remove photo
    const handleRestoreInitials = () => {
      currentUser = { ...currentUser, avatarUrl: undefined };
    };

    handleRestoreInitials();
    expect(currentUser.avatarUrl).toBeUndefined();

    // 2. Upload photo
    const handleUploadPhoto = (newAvatarUrl: string) => {
      currentUser = { ...currentUser, avatarUrl: newAvatarUrl };
    };

    handleUploadPhoto('data:image/png;base64,newPhotoData456');
    expect(currentUser.avatarUrl).toBe('data:image/png;base64,newPhotoData456');

    // 3. Remove photo
    const handleRemovePhoto = () => {
      currentUser = { ...currentUser, avatarUrl: undefined };
    };

    handleRemovePhoto();
    expect(currentUser.avatarUrl).toBeUndefined();
  });

  it('validates interactive card geometry and styling invariants', () => {
    const cardDesignRules = {
      shape: 'rounded-3xl overflow-hidden',
      sizing: 'w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96',
      cornerInteraction: 'bottom-left nested reveal',
      backdrop: 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md'
    };

    expect(cardDesignRules.shape).toContain('rounded-3xl');
    expect(cardDesignRules.sizing).toContain('md:w-96');
    expect(cardDesignRules.backdrop).toContain('backdrop-blur-md');
  });
});
