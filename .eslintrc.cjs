module.exports = {
    root: true,
    env: {
        es2021: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
    },
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    overrides: [
        {
            env: {
                node: true,
            },
            files: ['.eslintrc.c?js'],
            parserOptions: {
                sourceType: 'script',
            },
        },
        {
            files: ['tools/**/*.c?js'],
            rules: {
                'import/no-extraneous-dependencies': 'off',
            },
        },
    ],
    plugins: ['prettier', '@typescript-eslint'],
    rules: {
        'no-console': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
};
