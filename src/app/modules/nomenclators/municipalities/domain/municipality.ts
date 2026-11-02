export interface Municipality {
    code: string;
    shortName: string;
    name: string;
    active: boolean;
    provinceCode: string | null;
    provinceName: string | null;
}

export interface MunicipalityInput {
    code: string;
    shortName: string;
    name: string;
    provinceCode: string;
}

export interface MunicipalityPage {
    objects: Municipality[];
    nextCursor: string | null;
}
