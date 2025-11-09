import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionSettings extends Document {
  isOpen: boolean;
  feeAmount: number;
}

const admissionSettingsSchema = new Schema<IAdmissionSettings>({
  isOpen: { type: Boolean, default: false },
  feeAmount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IAdmissionSettings>('AdmissionSettings', admissionSettingsSchema);
