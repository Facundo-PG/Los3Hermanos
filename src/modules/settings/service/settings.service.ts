import { Injectable } from '@nestjs/common';
import { SettingsRepository } from '../repository/settings.repository';
import { ResponseTemplate } from '../../../helpers/response.template';
import { ISettingsService } from './interfaces/settings.service.interfaces';
import { UpdateSettingsDto } from '../repository/dto/update.settings.dto';

@Injectable()
export class SettingsService implements ISettingsService {
    constructor(private readonly settingsRepository: SettingsRepository) { }

    async listSettings(): Promise<ResponseTemplate> {
        try {
            const settings = await this.settingsRepository.listSettings();

            if (!settings) {
                return new ResponseTemplate(
                    404,
                    'No se encontró configuración',
                    null,
                );
            }

            return new ResponseTemplate(200, 'Configuración obtenida', settings);
        } catch (error) {
            console.error('Error en servicio de configuración:', error);
            return new ResponseTemplate(
                500,
                `Error al obtener configuración: ${error.message}`,
                null,
            );
        }
    }

    async updateSettings(data: UpdateSettingsDto): Promise<ResponseTemplate> {
        try {
            const updatedSettings = await this.settingsRepository.updateSettings(data);

            if (!updatedSettings) {
                return new ResponseTemplate(
                    404,
                    'No se encontró configuración para actualizar',
                    null,
                );
            }

            return new ResponseTemplate(200, 'Configuración actualizada', updatedSettings);
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            return new ResponseTemplate(
                500,
                `Error al actualizar configuración: ${error.message}`,
                null,
            );
        }
    }
}
