module.exports = {
    content: ["./src/**/*.{html,js,vue}", "./src/*.{html,js,vue}"],
    theme: {
        extend: {
            colors: {
                'cobbg': '#fda1e004',
                'cobline': '#cdcac4',
                'error': 'rgb(239 68 68)'
            },
        },
    },
    safelist: [
        {
            pattern: /.*/,
            variants: ['md','hover'],
        },
    ],
    plugins: [],
}
