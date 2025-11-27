import { plugin } from 'mongoose';
import type { Config } from 'tailwindcss';  
import { plugins } from './postcss.config.cjs';

export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme :{
        extend: {},
    },
    plugins: [],

} satisfies Config;