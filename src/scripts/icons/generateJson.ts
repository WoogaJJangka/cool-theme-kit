import { IconThemeGenerator } from 'src/icons/generators/IconThemeGenerator';
import { ProductThemeGenerator } from 'src/icons/generators/ProductThemeGenerator';
import { ProductIconGenerator } from 'src/productIcons/ProductIconGenerator';
import { ColorThemeGenerator } from 'src/themes/ColorThemeGenerator';

const generate = async () => {
  const iconThemeGenerator = new IconThemeGenerator();
  await iconThemeGenerator.createJsonTheme();

  const productThemeGenerator = new ProductThemeGenerator();
  productThemeGenerator.createJsonTheme();

  new ColorThemeGenerator().createJsonThemes();

  new ProductIconGenerator().createJsonTheme();
};

// ts-node runs it as CommonJS, without top-level await
// eslint-disable-next-line unicorn/prefer-top-level-await
generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
