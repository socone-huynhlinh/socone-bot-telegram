import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"

export default [
    {
        files: ["**/*.{ts}"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: false, // Không cho phép bỏ qua kiểu trả về trong arrow functions
                    allowTypedFunctionExpressions: false, // Không cho phép bỏ qua ngay cả khi trong type hoặc interface
                    allowHigherOrderFunctions: false, // Không cho phép bỏ qua trong hàm cấp cao
                },
            ],
        },
    },
]
