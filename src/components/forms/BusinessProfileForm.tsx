import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../db';
import { GlassCard } from '../ui/GlassCard';
import { Save, Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { BusinessProfile } from '../../types';

// 1. Define the Schema
const profileSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal('')),
  bankName: z.string().min(2, "Bank name required"),
  accountNumber: z.string().min(10, "Account number required"),
  accountName: z.string().min(2, "Account name required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function BusinessProfileForm() {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  // 2. Load existing data on mount
  useEffect(() => {
    async function loadProfile() {
      const profile = await db.businessProfile.orderBy('id').first();
      if (profile) {
        setValue('businessName', profile.businessName);
        setValue('ownerName', profile.ownerName || '');
        setValue('address', profile.address);
        setValue('phone', profile.phone);
        setValue('email', profile.email || '');
        setValue('bankName', profile.bankName);
        setValue('accountNumber', profile.accountNumber);
        setValue('accountName', profile.accountName);

        if (profile.logoUrl) {
          setLogoPreview(profile.logoUrl);
        }
      }
    }
    loadProfile();
  }, [setValue]);

  // 3. Handle File Upload (Convert to Base64/Blob URL for preview)
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Logo must be under 2MB");
        return;
      }
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  // 4. Save to Dexie DB
  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setSuccessMsg('');
    try {
      // Create Blob URL for storage if new file exists
      // Note: In a real PWA, you might store the actual Blob in IndexedDB
      // For this MVP, we will use FileReader to store base64 string or keep the Blob
      let finalLogoUrl = logoPreview;

      if (logoFile) {
        // Convert to Base64 for simple storage in IndexedDB (works well for small images)
        finalLogoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoFile);
        });
      }

      const profileData: BusinessProfile = {
        ...data,
        logoUrl: finalLogoUrl || undefined,
      };

      // Check if ID exists to update, else add
      const existing = await db.businessProfile.orderBy('id').first();
      if (existing && existing.id) {
        await db.businessProfile.update(existing.id, profileData);
      } else {
        await db.businessProfile.add(profileData);
      }

      setSuccessMsg('Profile saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  // Helper for Input Styling
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider";

  return (
    <GlassCard className="max-w-2xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Business Profile</h2>
        <p className="text-slate-400 text-sm">This information will appear on your invoices.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <div className={clsx(
            "h-24 w-24 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden bg-white/5",
            logoPreview ? "border-solid border-indigo-500" : ""
          )}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500 text-center px-2">No Logo</span>
            )}
          </div>
          <div>
            <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
              <Upload size={16} />
              Upload Logo
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <p className="text-xs text-slate-500 mt-2">Recommended: Square PNG, max 2MB.</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Business Name</label>
            <input {...register('businessName')} className={inputClass} placeholder="e.g. Alari Aso Oke" />
            {errors.businessName && <span className="text-red-400 text-xs">{errors.businessName.message}</span>}
          </div>
          <div>
            <label className={labelClass}>Owner Name (Optional)</label>
            <input {...register('ownerName')} className={inputClass} placeholder="e.g. Ronke" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input {...register('phone')} className={inputClass} placeholder="+234..." />
            {errors.phone && <span className="text-red-400 text-xs">{errors.phone.message}</span>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Office Address</label>
          <textarea {...register('address')} rows={2} className={inputClass} placeholder="Full street address..." />
          {errors.address && <span className="text-red-400 text-xs">{errors.address.message}</span>}
        </div>

        {/* Payment Details */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bank Name</label>
              <input {...register('bankName')} className={inputClass} placeholder="e.g. GTBank" />
              {errors.bankName && <span className="text-red-400 text-xs">{errors.bankName.message}</span>}
            </div>
            <div>
              <label className={labelClass}>Account Number</label>
              <input {...register('accountNumber')} className={inputClass} placeholder="0123456789" />
              {errors.accountNumber && <span className="text-red-400 text-xs">{errors.accountNumber.message}</span>}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Account Name</label>
              <input {...register('accountName')} className={inputClass} placeholder="Account Holder Name" />
              {errors.accountName && <span className="text-red-400 text-xs">{errors.accountName.message}</span>}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {successMsg && <span className="text-green-400 text-sm font-medium animate-pulse">{successMsg}</span>}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save Profile
          </button>
        </div>

      </form>
    </GlassCard>
  );
}