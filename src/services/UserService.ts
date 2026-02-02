import { KycProfile, TransactionRecord, ConvertRequest, TransferRequest, CurrencyType } from '@/types';
import { BlockchainService } from './BlockchainService';

// Mock KYC data store
const kycStore: Map<string, KycProfile> = new Map();

// Mock transaction history
const transactionHistory: TransactionRecord[] = [];

// Business rule constants
export const DAILY_DEPOSIT_LIMIT = 50000;
export const CONVERSION_CAP = 10000;

class UserServiceClass {
  // TODO: integrate real API
  async getKyc(userId: string): Promise<KycProfile | null> {
    await this.simulateDelay();
    return kycStore.get(userId) || null;
  }

  // TODO: integrate real API
  async submitKyc(userId: string, profile: Partial<KycProfile>, files: FileList | null): Promise<KycProfile> {
    await this.simulateDelay();
    
    const kyc: KycProfile = {
      id: `kyc-${Date.now()}`,
      userId,
      fullName: profile.fullName || '',
      email: profile.email || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth || '',
      documents: files ? Array.from(files).map(f => f.name) : [],
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    
    kycStore.set(userId, kyc);
    return kyc;
  }

  // TODO: integrate real API
  async depositUSD(
    userId: string, 
    amount: number, 
    bank: 'A' | 'B',
    currentDailyUsed: number
  ): Promise<{ token: 'DA' | 'DB'; amount: number; txHash: string }> {
    // Validate daily limit
    if (currentDailyUsed + amount > DAILY_DEPOSIT_LIMIT) {
      throw new Error(`Daily deposit limit exceeded. Remaining: $${DAILY_DEPOSIT_LIMIT - currentDailyUsed}`);
    }

    const token = bank === 'A' ? 'DA' : 'DB';
    const txHash = await BlockchainService.mintDepositToken(amount, token);
    
    // Record transaction
    this.addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'deposit',
      details: `Deposited $${amount} USD → ${amount} ${token}`,
      txHash,
      status: 'completed',
      amount,
      from: 'USD',
      to: token,
    });

    return { token, amount, txHash };
  }

  // TODO: integrate real API
  async convert(userId: string, req: ConvertRequest): Promise<{ txHashes: string[] }> {
    // Validate conversion cap
    if (req.amount > CONVERSION_CAP) {
      throw new Error(`Conversion cap exceeded. Maximum: $${CONVERSION_CAP} per transaction`);
    }

    const txHashes: string[] = [];

    // Handle different conversion paths
    if (req.from === 'USD' && (req.to === 'DA' || req.to === 'DB')) {
      // USD → DA/DB (same as deposit)
      const hash = await BlockchainService.mintDepositToken(req.amount, req.to);
      txHashes.push(hash);
    } else if ((req.from === 'DA' || req.from === 'DB') && req.to === 'CS') {
      // DA/DB → CS: burn deposit, mint consortium
      const burnHash = await BlockchainService.burnForConsortium(req.amount, req.from);
      txHashes.push(burnHash);
      
      const mintHash = await BlockchainService.mintConsortiumToken(req.amount);
      txHashes.push(mintHash);
    } else if (req.from === 'CS' && req.to === 'USD') {
      // CS → USD: burn consortium (off-chain fiat simulated)
      const hash = await BlockchainService.burnConsortiumToken(req.amount);
      txHashes.push(hash);
    } else if (req.from === 'CS' && (req.to === 'DA' || req.to === 'DB')) {
      // CS → DA/DB: burn consortium, mint deposit
      const burnHash = await BlockchainService.burnConsortiumToken(req.amount);
      txHashes.push(burnHash);
      
      const mintHash = await BlockchainService.mintDepositToken(req.amount, req.to);
      txHashes.push(mintHash);
    }

    // Record transaction
    this.addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'convert',
      details: `Converted ${req.amount} ${req.from} → ${req.amount} ${req.to}`,
      txHash: txHashes[txHashes.length - 1],
      status: 'completed',
      amount: req.amount,
      from: req.from,
      to: req.to,
    });

    return { txHashes };
  }

  // TODO: integrate real API
  async transfer(userId: string, req: TransferRequest): Promise<{ txHashes: string[] }> {
    const txHashes: string[] = [];

    if (req.type === 'intra') {
      // Intra-bank transfer: just transfer the deposit token
      const hash = await BlockchainService.transferToken(
        req.token,
        req.toUserId || '',
        req.amount
      );
      txHashes.push(hash);

      this.addTransaction({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'intra_transfer',
        details: `Intra-bank transfer: ${req.amount} ${req.token} to ${req.toUserId}`,
        txHash: hash,
        status: 'completed',
        amount: req.amount,
      });
    } else {
      // Inter-bank transfer: burn CS, then recipient bank mints their token
      const burnHash = await BlockchainService.transferCS(req.toUserId || '', req.amount);
      txHashes.push(burnHash);

      // Simulate the receiving bank minting their deposit token
      const mintHash = await BlockchainService.mintForRecipientBank(req.amount, req.toBank!);
      txHashes.push(mintHash);

      this.addTransaction({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'inter_transfer',
        details: `Inter-bank transfer: ${req.amount} CS to Bank ${req.toBank} user ${req.toUserId}`,
        txHash: burnHash,
        status: 'completed',
        amount: req.amount,
      });
    }

    return { txHashes };
  }

  // TODO: integrate real API
  async getHistory(userId: string): Promise<TransactionRecord[]> {
    await this.simulateDelay();
    return transactionHistory.slice(-20).reverse();
  }

  private addTransaction(tx: TransactionRecord) {
    transactionHistory.push(tx);
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const UserService = new UserServiceClass();
