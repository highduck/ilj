
export interface AndroidSigningConfig {
    storeFilePath: string;
    storePassword: string;
    keyAlias: string;
    keyPassword: string;
}

export interface AndroidSigningConfigurations {
    debug?: AndroidSigningConfig;
    release?: AndroidSigningConfig;
}

export interface AndroidProjectConfiguration {
    basedir: string;
    target: string;
    mode: 'development'|'production';
    debug: boolean;
}