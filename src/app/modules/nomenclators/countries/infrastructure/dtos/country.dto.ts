export interface CountryDto {
    code: string;
    name: string;
    active: boolean;
    isUnitedState: boolean;
}

export interface CountryWriteDto {
    code: string;
    name: string;
}
