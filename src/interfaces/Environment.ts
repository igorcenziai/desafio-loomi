export interface Environment {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL: string;
    PORT?: number;

    POSTGRES_DB?: string;
    POSTGRES_USER?: string;
    POSTGRES_PASSWORD?: string;
    POSTGRES_PORT?: number;
    POSTGRES_HOST?: string;

    APP_PORT?: number | string;

    OPENAI_API_KEY?: string;

    [key: string]: string | number | undefined;
}