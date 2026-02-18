import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './service/settings.service';
import { SettingsRepository } from './repository/settings.repository';
import { PrismaModule } from '../../prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SettingsController],
    providers: [SettingsService, SettingsRepository],
    exports: [SettingsService, SettingsRepository],
})
export class SettingsModule { }
