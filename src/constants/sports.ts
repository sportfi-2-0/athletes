/**
 * Single source of truth for the sports list used across the app
 * (signup profile + script generation form). Keeping it here prevents the
 * two screens from drifting out of sync.
 */
export interface SportOption {
  value: string;
  label: string;
}

export const sports: SportOption[] = [
  { value: "futebol", label: "Futebol" },
  { value: "basquete", label: "Basquete" },
  { value: "volei", label: "Vôlei" },
  { value: "natacao", label: "Natação" },
  { value: "atletismo", label: "Atletismo" },
  { value: "tenis", label: "Tênis" },
  { value: "mma-luta", label: "MMA / Lutas" },
  { value: "jiu-jitsu", label: "Jiu-Jitsu" },
  { value: "crossfit", label: "CrossFit" },
  { value: "musculacao", label: "Musculação / Bodybuilding" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "corrida", label: "Corrida" },
  { value: "surfe", label: "Surfe" },
  { value: "skate", label: "Skate" },
  { value: "ginastica", label: "Ginástica" },
  { value: "handebol", label: "Handebol" },
  { value: "futsal", label: "Futsal" },
  { value: "boxe", label: "Boxe" },
  { value: "esgrima", label: "Esgrima" },
  { value: "esports", label: "eSports" },
  { value: "triathlon", label: "Triathlon" },
  { value: "polo-aquatico", label: "Polo Aquático" },
  { value: "rugby", label: "Rugby" },
  { value: "golf", label: "Golf" },
  { value: "outro", label: "Outro" },
];
