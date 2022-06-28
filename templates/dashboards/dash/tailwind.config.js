module.exports = {
    content: ["./src/**/*.{html,js,vue}", "./src/*.{html,js,vue}"],
    theme: {
    },
    safelist: [
        {
            pattern: /.*/
        },
        {
            pattern: /(col-span|text|ring|grid-col|w-|flex-col|flex-row|space-x-).*/,
            variants: ['sm','md','lg','xl','2xl'],
        },
    ],
    plugins: [],
}