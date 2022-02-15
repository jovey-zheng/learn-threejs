import { ref } from "vue";

const fonts: string[] = [
  "Abril Fatface",
  "Advent Pro",
  "Arvo",
  "Bahiana",
  "Baloo Da",
  "Bigshot One",
  "Bowlby One",
  "Bungee",
  "Bungee Hairline",
  "Bungee Outline",
  "Bungee Shade",
  "Codystar",
  "Coiny",
  "Creepster",
  "Emblema One",
  "Erica One",
  "Expletus Sans",
  "Fascinate",
  "Finger Paint",
  "Goblin One",
  "Graduate",
  "Iceberg",
  "Impact",
  "Jolly Lodger",
  "Keania One",
  "Kumar One",
  "Kumar One Outline",
  "Krona One",
  "Lalezar",
  "Londrina Solid",
  "Metamorphous",
  "Mogra",
  "Mr Dafoe",
  "Nosifer",
  "Overlock SC",
  "Piedra",
  "Pirata One",
  "Plaster",
  "Rakkas",
  "Raleway",
  "Revalia",
  "Roboto",
  "Ruslan Display",
  "Rye",
  "Sancreek",
  "Sarina",
  "Sedgwick Ave Display",
  "Slackey",
  "Smokum",
  "Sonsie One",
  "Space Mono",
  "Trade Winds",
  "UnifrakturCook",
  "UnifrakturMaguntia",
  "Unlock",
  "Vampiro One",
  "Vibur",
  "Viga",
  "VT323",
  "Wallpoet",
  "Warnes",
  "Wire One",
  "Work Sans",
];

// font hook
export default function useFont() {
  const font = ref(fonts[1]);

  const changeFont = (f: Event | any): void => {
    font.value = f.value;
  };

  return [fonts, font, changeFont];
}
