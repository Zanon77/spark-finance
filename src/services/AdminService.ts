import { KycProfile, BankLimits } from '@/types';

// Mock data
let bankLimits: BankLimits = {
  bankA: { dailyDepositLimit: 50000 },
  bankB: { dailyDepositLimit: 50000 },
  offChainLedgerLimit: 1000000,
};

const mockPendingKyc: KycProfile[] = [
  {
    id: 'kyc-1',
    userId: 'user-2',
    fullName: 'Jane Smith',
    email: 'jane@bankb.com',
    address: '456 Oak Ave, City, State 12345',
    dateOfBirth: '1985-03-20',
    documents: ['id_card.pdf', 'proof_of_address.pdf'],
    status: 'pending',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'kyc-2',
    userId: 'user-3',
    fullName: 'Bob Johnson',
    email: 'bob@banka.com',
    address: '789 Pine St, Town, State 67890',
    dateOfBirth: '1990-07-12',
    documents: ['passport.pdf'],
    status: 'pending',
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

class AdminServiceClass {
  // TODO: integrate real API
  async setBankDepositLimit(bankId: string, limit: number): Promise<void> {
    await this.simulateDelay();
    
    if (limit <= 0 || limit > 1000000) {
      throw new Error('Limit must be between 1 and 1,000,000');
    }
    
    if (bankId === 'A') {
      bankLimits.bankA.dailyDepositLimit = limit;
    } else if (bankId === 'B') {
      bankLimits.bankB.dailyDepositLimit = limit;
    }
  }

  // TODO: integrate real API
  async setOffChainLedgerLimit(limit: number): Promise<void> {
    await this.simulateDelay();
    
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }
    
    bankLimits.offChainLedgerLimit = limit;
  }

  // TODO: integrate real API
  async approveKyc(userId: string): Promise<void> {
    await this.simulateDelay();
    
    const kyc = mockPendingKyc.find(k => k.userId === userId);
    if (kyc) {
      kyc.status = 'approved';
    }
  }

  // TODO: integrate real API
  async rejectKyc(userId: string, reason: string): Promise<void> {
    await this.simulateDelay();
    
    const kyc = mockPendingKyc.find(k => k.userId === userId);
    if (kyc) {
      kyc.status = 'rejected';
      kyc.rejectionReason = reason;
    }
  }

  // TODO: integrate real API
  async getPendingKyc(): Promise<KycProfile[]> {
    await this.simulateDelay();
    return mockPendingKyc.filter(k => k.status === 'pending');
  }

  // TODO: integrate real API
  async getBankLimits(): Promise<BankLimits> {
    await this.simulateDelay();
    return { ...bankLimits };
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const AdminService = new AdminServiceClass();
