export class AudioServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioServiceError';
  }
}

export class FileNotFoundError extends AudioServiceError {
  constructor(fileId: string) {
    super(`Audio file with ID ${fileId} not found`);
    this.name = 'FileNotFoundError';
  }
}

export class BatchNotFoundError extends AudioServiceError {
  constructor(batchId: string) {
    super(`Batch with ID ${batchId} not found`);
    this.name = 'BatchNotFoundError';
  }
}

export class InvalidFileError extends AudioServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFileError';
  }
}

export class StorageError extends AudioServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ConfigurationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationServiceError';
  }
}

export class CallServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallServiceError';
  }
}

export class DashboardServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardServiceError';
  }
} 