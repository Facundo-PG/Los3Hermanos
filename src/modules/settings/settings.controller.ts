import { Controller, Get, Res, UseGuards, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { SettingsService } from './service/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { UpdateSettingsDto } from './repository/dto/update.settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Roles('admin', 'cliente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('list')
    @ApiOperation({ summary: 'Get settings configuration' })
    @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Settings not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al obtener la configuración del sistema' },
            },
        },
    })
    async listSettings(@Res() res: Response) {
        const { statusCode, message, data } =
            await this.settingsService.listSettings();
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put('update')
    @ApiOperation({ summary: 'Update settings configuration (Admin only)' })
    @ApiResponse({ status: 200, description: 'Settings updated successfully' })
    @ApiResponse({ status: 404, description: 'Settings not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al actualizar la configuración del sistema' },
            },
        },
    })
    async updateSettings(
        @Body() updateSettingsDto: UpdateSettingsDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.settingsService.updateSettings(updateSettingsDto);
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }
}
