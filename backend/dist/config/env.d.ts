export declare const config: {
    NODE_ENV: string;
    PORT: number;
    API_PREFIX: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    blockchain: {
        rpcUrl: string;
        contractAddress: string;
        privateKey: string;
    };
    jwt: {
        secret: string;
        expire: string;
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        bucketName: string;
    };
    ipfs: {
        url: string;
    };
    qr: {
        baseUrl: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
    };
};
export default config;
//# sourceMappingURL=env.d.ts.map