import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    {
        files: ["**/*.{ts,tsx}"],
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

            // Yêu cầu kiểu trả về rõ ràng cho hàm
            "@typescript-eslint/explicit-function-return-type": [
                "warn",
                {
                    allowExpressions: false,
                    allowTypedFunctionExpressions: false,
                    allowHigherOrderFunctions: false,
                },
            ],

            // Báo lỗi nếu có biến không được sử dụng
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    vars: "all",
                    args: "after-used",
                    ignoreRestSiblings: true,
                    varsIgnorePattern: "^_.*$", // Bỏ qua các biến bắt đầu bằng _
                },
            ],

            // Cảnh báo khi sử dụng console.log
            "no-console": "error",
        },
    },
];
