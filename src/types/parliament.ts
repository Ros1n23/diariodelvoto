export type Chamber = 'congreso' | 'senado' | 'europarl';

export type InitiativeType = 
  | 'real_decreto_ley' 
  | 'proyecto_ley' 
  | 'proposicion_ley' 
  | 'mocion' 
  | 'enmienda_totalidad';

export type VoteOutcome = 
  | 'aprobado' 
  | 'rechazado' 
  | 'en_tramite' 
  | 'agendado';

export type DayStatus = 
  | 'past' 
  | 'today' 
  | 'upcoming' 
  | 'no_session';

export interface ParliamentaryMeasure {
  id: string;
  title: string;
  category: string;
  plainDescription: string;
  whoIsAffected: string[];
  realWorldExample: string;
  argumentsPro: string[];
  argumentsContra: string[];
}

export type VoteChoice = 'si' | 'no' | 'abstencion' | 'no_vota';

export interface DeputyVote {
  id: string;
  name: string;
  group: string;
  party: string;
  seatNumber: number;
  vote: VoteChoice;
  province: string;
}

export interface GroupVoteSummary {
  groupName: string;
  totalSeats: number;
  si: number;
  no: number;
  abstencion: number;
  noVota: number;
  color: string;
}

export interface InitiativeThreeKeys {
  what: string;   // ¿De qué va esto en cristiano?
  pocket: string; // ¿Qué le pasa a tu bolsillo o tu día a día? (con cifra clave)
  clash: string;  // ¿Por qué discuten los partidos?
}

export interface BeforeVsAfter {
  before: string; // Cómo estaban las cosas antes de esta ley
  after: string;  // Lo que cambia a partir de ahora en la calle
}

export interface Initiative {
  id: string;
  title: string;
  officialTitle: string;
  chamber: Chamber;
  date: string; // YYYY-MM-DD
  time?: string;
  type: InitiativeType;
  status: VoteOutcome;
  category: string;
  summary: string;
  isOmnibus: boolean;
  threeKeys?: InitiativeThreeKeys;
  beforeVsAfter?: BeforeVsAfter;
  measures: ParliamentaryMeasure[];
  votesSummary?: {
    si: number;
    no: number;
    abstencion: number;
    noVota: number;
    total: number;
  };
  groupVotes?: GroupVoteSummary[];
  deputies?: DeputyVote[];
  bocgUrl?: string;
  expedienteNumber?: string;
}

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  status: DayStatus;
  hasSession: boolean;
  initiativesCount: number;
  approvedCount: number;
  rejectedCount: number;
  scheduledCount: number;
  inProgressCount: number;
  initiatives: Initiative[];
}

export type SponsorStatus = 'pending_approval' | 'queued' | 'active' | 'archived' | 'rejected';

export interface Sponsor {
  id: string;
  name: string;
  url: string;
  message: string;
  amountCents: number;
  amountEur: number;
  currency: string;
  status: SponsorStatus;
  rejectionReason?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  approvedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SponsorAuctionState {
  activeSponsor: Sponsor | null;
  queuedCount: number;
  minNextBidEur: number;
  history: Sponsor[];
}
