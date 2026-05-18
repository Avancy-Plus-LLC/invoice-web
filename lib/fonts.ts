import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'NotoSansJP',
    fonts: [
      { src: '/fonts/NotoSansJP-Regular.woff', fontWeight: 400 },
      { src: '/fonts/NotoSansJP-Bold.woff', fontWeight: 700 },
    ],
  });
}
