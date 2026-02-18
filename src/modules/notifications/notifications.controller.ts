import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { NotificationsService } from './service/notifications.service';
import { SendEmailDto } from './dto/send-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { ResponseTemplate } from '../../helpers/response.template';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('email')
    @ApiOperation({ summary: 'Send email notification to customer' })
    @ApiResponse({ status: 200, description: 'Notification sent successfully' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al enviar notificación' },
            },
        },
    })
    async sendEmail(
        @Body() data: SendEmailDto,
        @Res() res: Response,
    ) {
        try {
            const result = await this.notificationsService.sendOrderStatusEmail(data);
            const response = new ResponseTemplate(
                200,
                'Notification generated successfully',
                result,
            );
            res.status(response.statusCode).json(response);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : 'Error al enviar notificación';
            const response = new ResponseTemplate(500, 'Internal Server Error', {
                mensajeError: errMsg,
            });
            res.status(response.statusCode).json(response);
        }
    }
}
