import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

/**
 * Heširanje za create()/save() i svaku izmenu passworda
 */
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

/**
 * (Opcionalno) Heširanje kod insertMany; radi nad plain objektima, bez isModified
 */
UserSchema.pre(
  'insertMany',
  async function (next, docs: Array<Partial<IUser>>) {
    try {
      for (const doc of docs) {
        const pwd = (doc as any).password;
        // ako nije već bcrypt hash (počinje sa $2...), heširaj
        if (typeof pwd === 'string' && !pwd.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          (doc as any).password = await bcrypt.hash(pwd, salt);
        }
      }
      next();
    } catch (err) {
      next(err as Error);
    }
  }
);

UserSchema.methods.comparePassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
