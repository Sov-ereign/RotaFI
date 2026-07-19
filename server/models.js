import mongoose from 'mongoose';
const { Schema } = mongoose;

const toJSON = {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

// ── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new Schema({
  name:          { type: String, required: true, trim: true, maxlength: 40 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true },
  walletAddress: { type: String, default: null },
  bio:           { type: String, default: '', maxlength: 280 },
  createdAt:     { type: Date, default: Date.now },
}, { toJSON });

export const User = mongoose.model('User', UserSchema);

// ── Committee ─────────────────────────────────────────────────────────────────
const CommitteeSchema = new Schema({
  name:              { type: String, required: true, trim: true },
  description:       { type: String, default: '' },
  contribution_amount: { type: Number, required: true },   // XLM
  cycle_length_days: { type: Number, required: true },
  member_count:      { type: Number, required: true },
  payout_rule:       { type: String, enum: ['turn_order', 'bidding'], default: 'turn_order' },
  organizer_wallet:  { type: String, required: true },
  organizer_name:    { type: String, required: true },
  organizer_id:      { type: Schema.Types.ObjectId, ref: 'User', default: null },
  current_cycle:     { type: Number, default: 0 },
  status:            { type: String, enum: ['forming', 'active', 'completed', 'cancelled'], default: 'forming' },
  penalty_strategy:  { type: String, default: 'delay' },
  penalty_amount:    { type: Number, default: 0 },
  started_at:        { type: Date, default: null },
  completed_at:      { type: Date, default: null },
  created_at:        { type: Date, default: Date.now },
}, { toJSON });

export const Committee = mongoose.model('Committee', CommitteeSchema);

// ── Member ────────────────────────────────────────────────────────────────────
const MemberSchema = new Schema({
  committee_id:       { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
  user_id:            { type: Schema.Types.ObjectId, ref: 'User', default: null },
  wallet_address:     { type: String, required: true },
  display_name:       { type: String, required: true },
  payout_position:    { type: Number, default: null },
  has_received_payout:{ type: Boolean, default: false },
  joined_at:          { type: Date, default: Date.now },
}, { toJSON });

export const Member = mongoose.model('Member', MemberSchema);

// ── Contribution ──────────────────────────────────────────────────────────────
const ContributionSchema = new Schema({
  committee_id: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
  member_id:    { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  cycle_index:  { type: Number, required: true },
  amount:       { type: Number, required: true },   // XLM
  status:       { type: String, enum: ['pending', 'paid', 'defaulted', 'excused'], default: 'pending' },
  tx_hash:      { type: String, default: null },
  paid_at:      { type: Date, default: null },
  created_at:   { type: Date, default: Date.now },
}, { toJSON });

export const Contribution = mongoose.model('Contribution', ContributionSchema);

// ── Payout ────────────────────────────────────────────────────────────────────
const PayoutSchema = new Schema({
  committee_id:        { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
  cycle_index:         { type: Number, required: true },
  recipient_member_id: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  amount:              { type: Number, required: true },   // XLM
  status:              { type: String, enum: ['scheduled', 'released', 'forfeited'], default: 'scheduled' },
  tx_hash:             { type: String, default: null },
  released_at:         { type: Date, default: null },
  created_at:          { type: Date, default: Date.now },
}, { toJSON });

export const Payout = mongoose.model('Payout', PayoutSchema);

// ── ActivityLog ───────────────────────────────────────────────────────────────
const ActivityLogSchema = new Schema({
  committee_id: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
  event_type:   { type: String, required: true },
  actor_wallet: { type: String, default: null },
  summary:      { type: String, required: true },
  metadata:     { type: Schema.Types.Mixed, default: {} },
  created_at:   { type: Date, default: Date.now },
}, { toJSON });

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
