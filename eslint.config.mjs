import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "sort-imports": ["error", {
        "ignoreCase": true,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "allowSeparatedGroups": false
      }],
      "import/order": ["error", {
        "groups": [
          ["builtin", "external"],
          ["internal", "parent", "sibling", "index", "object", "unknown"]
        ],
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always"
      }]
    },
    settings: {
      "import/internal-regex": "^@/"
    }
  }
]);
