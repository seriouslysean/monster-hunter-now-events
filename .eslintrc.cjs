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
        // Extensions for known files are always required when using type="module"
        'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
        'no-console': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
};
