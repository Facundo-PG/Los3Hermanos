import { settings } from '@prisma/client';
import { UpdateSettingsDto } from '../dto/update.settings.dto';

export interface ISettingsRepository {
    listSettings(): Promise<settings | null>;
    updateSettings(data: UpdateSettingsDto): Promise<settings | null>;
}
