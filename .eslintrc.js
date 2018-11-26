module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
     "no-console": "off",
     "no-unused-vars": "off",
     "no-undef": "off",
     "no-useless-escape": "off",
     "no-fallthrough": "off",
     "no-case-declarations": "off",
     "no-mixed-spaces-and-tabs": "off"
    }
};
