/**
 * Single source of truth for the countries list used across signup and the
 * profile page.
 */
export interface CountryOption {
  value: string;
  label: string;
}

export const countries: CountryOption[] = [
  { value: "BR", label: "Brasil" },
  { value: "PT", label: "Portugal" },
  { value: "US", label: "Estados Unidos" },
  { value: "AR", label: "Argentina" },
  { value: "ES", label: "Espanha" },
  { value: "MX", label: "México" },
  { value: "CO", label: "Colômbia" },
  { value: "CL", label: "Chile" },
  { value: "UY", label: "Uruguai" },
  { value: "PY", label: "Paraguai" },
  { value: "outro", label: "Outro" },
];
