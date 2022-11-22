module.exports = {
    content: ["./src/**/*.{html,js,vue}", "./src/*.{html,js,vue}"],
    theme: {
    },
    safelist: [
        {
            pattern: /.*/,
            variants: ['sm','md','lg','xl','2xl','hover']
        },
    ],
    plugins: [],
}