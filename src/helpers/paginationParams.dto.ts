import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class PaginationRequestListDto {
    @IsOptional()
    @IsNumberString()
    items?: number;

    @IsOptional()
    @IsNumberString()
    itemsPerPage?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    dateFrom?: string;

    @IsOptional()
    @IsString()
    dateTo?: string;
}
export interface PaginationParams {
    items?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortDesc?: boolean[];
    search?: string;
}
export interface PaginationResult<T> {
    totalData: number;
    items: number;
    itemsPerPage: number;
    data: T;
}
