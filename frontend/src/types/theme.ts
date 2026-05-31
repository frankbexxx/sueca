export interface CustomThemeColors {
  bgTop: string;
  bgBottom: string;
  accent: string;
  textTitle: string;
  felt: string;
}

export interface CustomThemeData {
  id: string;
  name: string;
  lore: string;
  colors: CustomThemeColors;
  createdAt: number;
}
