const fs = require("fs-extra");
const concat = require("concat");

const build = async () => {
  const files = [
    "./dist/epub-player-wc/runtime.js",
    "./dist/epub-player-wc/polyfills.js",
    "./dist/epub-player-wc/scripts.js",
    "./dist/epub-player-wc/vendor.js",
    "./dist/epub-player-wc/main.js"
  ];

  await fs.ensureDir("dist/epub-player-wc");
  await concat(files, "web-component/sunbird-epub-player.js");
  await concat(files, "web-component-demo/sunbird-epub-player.js");
  const isAssetsAvailable = await fs.ensureDir("./dist/epub-player-wc/assets");
  if (isAssetsAvailable) {
    await fs.copy("./dist/epub-player-wc/assets", "web-component/assets");
  }
  await fs.copy("./dist/epub-player-wc/styles.css", "web-component/styles.css")
  await fs.copy("./dist/epub-player-wc/styles.css", "web-component-demo/styles.css")
  await fs.copy("README.md", "web-component/README.md")
  console.log("Files concatenated successfully!!!");
};
build();
