export interface MunicipalityDto {
    code: string;
    descShort: string;
    descLong: string;
    active: boolean;
    provinceCode?: string | null;
    provinceDescLong?: string | null;
    provinceName?: string | null;
}

export interface MunicipalityWriteDto {
    code: string;
    descShort: string;
    descLong: string;
    provinceCode: string;
}

export interface MunicipalityPageDto {
    objects: MunicipalityDto[];
    nextCursor: string | null;
}
