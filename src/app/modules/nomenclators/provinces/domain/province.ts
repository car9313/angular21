export interface Province {
    code: string;
    shortName: string;
    name: string;
    active: boolean;
}

export interface ProvinceInput {
    code: string;
    shortName: string;
    name: string;
}

export interface ProvincePage {
    objects: Province[];
    nextCursor: string | null;
}
