import { BlockchainEvent, BlockchainEventType, TokenType } from '@/types';

type EventCallback = (event: BlockchainEvent) => void;

class BlockchainServiceClass {
  private listeners: Map<BlockchainEventType, EventCallback[]> = new Map();
  private globalListeners: EventCallback[] = [];

  // TODO: integrate real Web3/Ethers contract
  async mintDepositToken(amount: number, token: 'DA' | 'DB'): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'DepositMinted',
      signature: `DepositMinted(address sender, uint256 ${amount}, token ${token})`,
      data: { amount, token },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async burnForConsortium(amount: number, token: 'DA' | 'DB'): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'DepositBurned',
      signature: `DepositBurned(address sender, uint256 ${amount}, token ${token})`,
      data: { amount, token },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async mintConsortiumToken(amount: number): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'ConsortiumMinted',
      signature: `ConsortiumMinted(address sender, uint256 ${amount})`,
      data: { amount },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async burnConsortiumToken(amount: number): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'ConsortiumBurned',
      signature: `ConsortiumBurned(address sender, uint256 ${amount})`,
      data: { amount },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async transferCS(to: string, amount: number): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'ConsortiumBurned',
      signature: `ConsortiumBurned(address sender, uint256 ${amount})`,
      data: { to, amount },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async transferToken(token: TokenType, to: string, amount: number): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    this.emitEvent({
      type: 'DepositTransferred',
      signature: `DepositTransferred(address from, address ${to}, uint256 ${amount}, token ${token})`,
      data: { to, amount, token },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  // TODO: integrate real contract
  async mintForRecipientBank(amount: number, bank: 'A' | 'B'): Promise<string> {
    await this.simulateDelay();
    const txHash = this.generateTxHash();
    
    const eventType: BlockchainEventType = bank === 'A' ? 'ConsortiumMintedForBankA' : 'ConsortiumMintedForBankB';
    
    this.emitEvent({
      type: eventType,
      signature: `${eventType}(address recipient, uint256 ${amount})`,
      data: { amount, bank },
      timestamp: new Date().toISOString(),
    });
    
    return txHash;
  }

  listenToEvent(eventName: BlockchainEventType, cb: EventCallback): () => void {
    const listeners = this.listeners.get(eventName) || [];
    listeners.push(cb);
    this.listeners.set(eventName, listeners);
    
    return () => {
      const current = this.listeners.get(eventName) || [];
      this.listeners.set(eventName, current.filter(l => l !== cb));
    };
  }

  listenToAllEvents(cb: EventCallback): () => void {
    this.globalListeners.push(cb);
    return () => {
      this.globalListeners = this.globalListeners.filter(l => l !== cb);
    };
  }

  private emitEvent(event: BlockchainEvent) {
    // Notify specific listeners
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(cb => cb(event));
    
    // Notify global listeners
    this.globalListeners.forEach(cb => cb(event));
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800));
  }

  private generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export const BlockchainService = new BlockchainServiceClass();
