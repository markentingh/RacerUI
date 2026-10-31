import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';
import react from '@vitejs/plugin-react';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

const certificateName = "racerui.web.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

export default defineConfig(({ mode }) => {
    const viteEnv = loadEnv(mode, process.cwd(), '');
    const useHttp = viteEnv.VITE_USE_HTTP === 'true';
    const port = 6730;
    const target = useHttp ? 'http://localhost:6500' : 'https://localhost:6550';

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            host: '0.0.0.0',
            allowedHosts: ['localhost', 'tunnel.datasilk.io'],
            proxy: {
                '^/api': {
                    target,
                    secure: false
                },
                '^/image': {
                    target,
                    secure: false
                },
                '^/dashboardhub': {
                    target,
                    secure: false,
                    ws: true
                },
                // The backend's login is a form POST to / - the SPA posts to
                // /account/login and the proxy rewrites it
                '^/account/login$': {
                    target,
                    secure: false,
                    rewrite: () => '/'
                }
            },
            port: port,
            ...(useHttp ? {} : {
                https: {
                    key: fs.readFileSync(keyFilePath),
                    cert: fs.readFileSync(certFilePath),
                }
            })
        },
        build: {
            sourcemap: true,
            assetsInlineLimit: 0
        }
    };
})
