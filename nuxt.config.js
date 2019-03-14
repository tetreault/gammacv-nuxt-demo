const pkg = require("./package");

module.exports = {
  mode: "universal",

  /*
   ** Headers of the page
   */
  head: {
    title: "",
    meta: [
      { charset: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
      },
      {
        hid: "description",
        name: "description",
        content: ""
      },
      {
        name: "keywords",
        content: ""
      },
      { name: "author", content: "" },
      { name: "twitter:title", content: "" },
      {
        name: "twitter:card",
        content: "summary_large_image"
      },
      {
        name: "twitter:description",
        content: ""
      },
      {
        name: "twitter:image:src",
        content: ""
      },
      { property: "og:title", content: "" },
      { property: "og:url", content: "" },
      {
        property: "og:image",
        content: ""
      },
      {
        property: "og:image:secure_url",
        content: ""
      },
      {
        property: "og:image:url",
        content: ""
      },
      {
        property: "og:description",
        content: ""
      },
      { property: "og:site_name", content: "" }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.png" }],
    script: [
      { src: "libs/modernizr/modernizr.js" },
      { src: "libs/modernizr/detectizr.js" },
      { src: "libs/objectdetect/objectdetect.js" },
      { src: "libs/objectdetect/objectdetect.eye.js" }
    ]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },

  /*
   ** Global CSS
   */
  css: [],

  /*
   ** Plugins to load before mounting the App
   */
  //plugins: [{ src: '~/plugins/gammacv', ssr: false }],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    "@nuxtjs/axios",
    // Doc:https://github.com/nuxt-community/modules/tree/master/packages/bulma
    "@nuxtjs/bulma"
  ],
  /*
   ** Axios module configuration
   */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
  },

  /*
   ** Build configuration
   */
  build: {
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    },
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: "pre",
          test: /\.(js|vue)$/,
          loader: "eslint-loader",
          exclude: /(node_modules)/,
          options: {
            fix: true
          }
        });
      }
    }
  }
};
