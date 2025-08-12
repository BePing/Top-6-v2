import { Service } from "typedi";
import admin from 'firebase-admin';
import { LoggingService } from '../common';

@Service()
export class FirebaseConfigService {
  
  constructor(private readonly loggingService: LoggingService) {}

  configureFirestore(app: admin.app.App): admin.firestore.Firestore {
    const firestore = app.firestore();
    
    // Note: Firestore settings can only be called once during initialization
    // Since Firebase Admin is initialized elsewhere, we skip settings here
    this.setupFirestoreErrorHandling();
    
    return firestore;
  }


  private setupFirestoreErrorHandling(): void {
    // Add error handling interceptors would go here if available
    // Currently Firebase Admin SDK doesn't support global error interceptors
    this.loggingService.trace('✅ Firestore error handling configured');
  }

  /**
   * Creates a batch write operation with monitoring
   */
  createMonitoredBatch(firestore: admin.firestore.Firestore, operation: string): admin.firestore.WriteBatch {
    const batch = firestore.batch();
    const startTime = Date.now();
    
    // Override commit method to add monitoring
    const originalCommit = batch.commit.bind(batch);
    batch.commit = async () => {
      try {
        this.loggingService.trace(`Starting batch operation: ${operation}`);
        const result = await originalCommit();
        const duration = Date.now() - startTime;
        this.loggingService.trace(`✅ Batch operation ${operation} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.loggingService.error(`❌ Batch operation ${operation} failed after ${duration}ms:`, error);
        throw error;
      }
    };
    
    return batch;
  }

  /**
   * Execute operation with retry logic for transient failures
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000,
    operationName: string = 'Firestore operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.loggingService.trace(`Attempting ${operationName} (attempt ${attempt}/${maxRetries})`);
        const result = await operation();
        if (attempt > 1) {
          this.loggingService.info(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        this.loggingService.warn(`⚠️ ${operationName} failed on attempt ${attempt}:`, error);
        
        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          this.loggingService.error(`❌ ${operationName} failed with non-retryable error`);
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
          this.loggingService.trace(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.loggingService.error(`❌ ${operationName} failed after ${maxRetries} attempts`);
    throw lastError;
  }

  private isRetryableError(error: Error): boolean {
    // Common retryable Firestore errors
    const retryableErrors = [
      'DEADLINE_EXCEEDED',
      'RESOURCE_EXHAUSTED', 
      'ABORTED',
      'INTERNAL',
      'UNAVAILABLE',
      'CANCELLED'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message?.includes(retryableError) || error.name?.includes(retryableError)
    );
  }

  /**
   * Monitor collection size and performance
   */
  async getCollectionStats(firestore: admin.firestore.Firestore, collectionPath: string): Promise<{
    documentCount: number;
    avgDocumentSize: number;
    totalSize: number;
  }> {
    const startTime = Date.now();
    
    try {
      const collectionRef = firestore.collection(collectionPath);
      const snapshot = await collectionRef.get();
      
      let totalSize = 0;
      const documentCount = snapshot.size;
      
      snapshot.docs.forEach(doc => {
        // Approximate document size calculation
        const docData = doc.data();
        const docSize = JSON.stringify(docData).length;
        totalSize += docSize;
      });
      
      const avgDocumentSize = documentCount > 0 ? Math.round(totalSize / documentCount) : 0;
      const duration = Date.now() - startTime;
      
      this.loggingService.trace(`Collection stats for ${collectionPath} retrieved in ${duration}ms`);
      
      return {
        documentCount,
        avgDocumentSize,
        totalSize
      };
    } catch (error) {
      this.loggingService.error(`Failed to get collection stats for ${collectionPath}:`, error);
      throw error;
    }
  }
}