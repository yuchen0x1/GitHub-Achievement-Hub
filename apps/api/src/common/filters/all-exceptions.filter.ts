import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

/**
 * 全局异常过滤器。
 * - 统一响应结构
 * - 生产环境不泄露内部堆栈
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误，请稍后再试';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const p = payload as { message?: string | string[]; error?: string };
        message = Array.isArray(p.message)
          ? p.message.join('；')
          : (p.message ?? exception.message);
        error = p.error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    } else {
      this.logger.error(`未处理的异常: ${String(exception)}`);
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status} ${message}`);
    }

    const body: ErrorBody = {
      success: false,
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }
}
