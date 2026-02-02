// User and Auth types
export type UserRole = 'admin' | 'user';

export type Bank = 'A' | 'B';

export type TokenType = 'DA' | 'DB' | 'CS';

export type CurrencyType = 'USD' | 'DA' | 'DB' | 'CS';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  bank: Bank;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  balances: {
    USD: number;
    DA: number;
    DB: number;
    CS: number;
  };
  dailyDepositUsed: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// KYC types
export interface KycProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  address: string;
  dateOfBirth: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

// Transaction types
export type TransactionType = 
  | 'deposit' 
  | 'convert' 
  | 'intra_transfer' 
  | 'inter_transfer';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface TransactionRecord {
  id: string;
  date: string;
  type: TransactionType;
  details: string;
  txHash: string;
  status: TransactionStatus;
  amount: number;
  from?: CurrencyType;
  to?: CurrencyType;
}

// Event types
export type BlockchainEventType = 
  | 'DepositMinted'
  | 'DepositBurned'
  | 'ConsortiumMinted'
  | 'ConsortiumBurned'
  | 'DepositTransferred'
  | 'ConsortiumMintedForBankA'
  | 'ConsortiumMintedForBankB';

export interface BlockchainEvent {
  type: BlockchainEventType;
  signature: string;
  data: Record<string, any>;
  timestamp: string;
}

// Admin types
export interface BankLimits {
  bankA: {
    dailyDepositLimit: number;
  };
  bankB: {
    dailyDepositLimit: number;
  };
  offChainLedgerLimit: number;
}

// Request types
export interface ConvertRequest {
  from: CurrencyType;
  to: CurrencyType;
  amount: number;
}

export interface TransferRequest {
  type: 'intra' | 'inter';
  token: TokenType;
  fromBank: Bank;
  toBank?: Bank;
  toUserId?: string;
  amount: number;
}
