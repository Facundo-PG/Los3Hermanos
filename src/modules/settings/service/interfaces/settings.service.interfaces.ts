import { ResponseTemplate } from '../../../../helpers/response.template';
import { UpdateSettingsDto } from '../../repository/dto/update.settings.dto';

export interface ISettingsService {
    listSettings(): Promise<ResponseTemplate>;
    updateSettings(data: UpdateSettingsDto): Promise<ResponseTemplate>;
}
