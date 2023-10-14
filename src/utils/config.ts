import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// TODO: Figure out a better way to set paths
const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = dirname(FILENAME);

const ROOT = join(DIRNAME, '..', '..');

export const environment = process.env.NODE_ENV || 'development';

export const version = process.env.npm_package_version;

export const paths = {
    root: ROOT,
    dist: join(ROOT, 'dist'),
    fixtures: join(ROOT, 'fixtures'),
    src: join(ROOT, 'src'),
};

const MHN_ROOT_URL = 'https://monsterhunternow.com';

export const mhnUrls = {
    root: MHN_ROOT_URL,
    news: `${MHN_ROOT_URL}/news`,
};
