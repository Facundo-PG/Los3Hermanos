import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { settings } from '@prisma/client';
import { ISettingsRepository } from './interfaces/settings.repository.interfaces';
import { UpdateSettingsDto } from './dto/update.settings.dto';

@Injectable()
export class SettingsRepository implements ISettingsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async listSettings(): Promise<settings | null> {
        try {
            const settings = await this.prisma.settings.findFirst();
            return settings;
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            throw new Error(`Error al obtener configuración: ${error.message}`);
        }
    }

    async updateSettings(data: UpdateSettingsDto): Promise<settings | null> {
        try {
            // Obtener primer registro de settings
            const currentSettings = await this.prisma.settings.findFirst();

            if (!currentSettings) {
                throw new Error('No se encontró configuración para actualizar');
            }

            // Actualizar solo los campos enviados
            const updatedSettings = await this.prisma.settings.update({
                where: { id: currentSettings.id },
                data: {
                    ...(data.costo_delivery !== undefined && { costo_delivery: data.costo_delivery }),
                    ...(data.whatsapp_notificaciones !== undefined && { whatsapp_notificaciones: data.whatsapp_notificaciones }),
                    ...(data.esta_abierto !== undefined && { esta_abierto: data.esta_abierto }),
                    ...(data.direccion_local !== undefined && { direccion_local: data.direccion_local }),
                    ...(data.mensaje_alerta !== undefined && { mensaje_alerta: data.mensaje_alerta }),
                },
            });

            return updatedSettings;
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            throw new Error(`Error al actualizar configuración: ${error.message}`);
        }
    }
}
