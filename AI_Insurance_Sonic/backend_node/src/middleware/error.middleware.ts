import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    return;
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      status: 'fail',
      message: 'File upload error',
      error: err.message
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      status: 'fail',
      message: 'Database operation failed',
      error: err.message
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid input data',
      error: err.message
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
}; 