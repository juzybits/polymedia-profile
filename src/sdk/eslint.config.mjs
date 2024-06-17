import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tsEslint from "typescript-eslint";

export default [
    eslint.configs.recommended,
    ...tsEslint.configs.strictTypeChecked,
    ...tsEslint.configs.stylisticTypeChecked,
    {
        ignores: [ "**/dist", "**/node_modules" ],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                project: [ "./tsconfig.json" ],
            },
        },
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            "@stylistic/jsx-quotes": [ "error", "prefer-double" ],
            "@stylistic/member-delimiter-style": [ "error", { "multiline": { "delimiter": "semi" }, "singleline": { "delimiter": "semi" } } ],
            "@stylistic/no-tabs": "error",
            "@stylistic/quotes": [ "error", "double", { "avoidEscape": true } ],
            "@stylistic/semi": [ "error", "always" ],
            "@typescript-eslint/consistent-type-definitions": [ "error", "type" ],
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-unused-vars": [ "error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" } ],
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
            "no-constant-condition": "off",
        },
        settings: {
        },
    },
];
