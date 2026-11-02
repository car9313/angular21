export interface ProvinceDto {
    code: string;
    descShort: string;
    descLong: string;
    active: boolean;
}

export interface ProvinceWriteDto {
    code: string;
    descShort: string;
    descLong: string;
}

export interface ProvincePageDto {
    objects: ProvinceDto[];
    nextCursor: string | null;
}
