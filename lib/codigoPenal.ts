export interface ArticuloPenal {
  numero: number;
  delito: string;
  pena: string;
  titulo: string;
}

const PENA = {
  M1: "Presidio mayor en su grado mínimo a medio (5 años y 1 día a 15 años) y multa de 20 a 50 UTM. Genera antecedentes penales.",
  M2: "Presidio mayor en su grado máximo a presidio perpetuo (15 años y 1 día a presidio perpetuo) y multa de 40 a 100 UTM. Genera antecedentes penales.",
  N1: "Presidio menor en su grado máximo (3 años y 1 día a 5 años) y multa de 10 a 30 UTM. Genera antecedentes penales.",
  N2: "Presidio menor en su grado mínimo a medio (61 días a 3 años) y multa de 5 a 20 UTM. Genera antecedentes penales, salvo que el tribunal, atendida la escasa entidad del hecho, disponga lo contrario.",
  F1: "Prisión en cualquiera de sus grados (1 a 60 días) y multa de 1 a 4 UTM. No genera antecedentes penales, salvo reincidencia.",
  ESP: "La pena y la multa serán las establecidas en la ley especial que regula esta materia. Genera antecedentes penales conforme a dicha ley.",
} as const;

const T_V = "V. Delitos contra la vida y la integridad física";
const T_VI = "VI. Delitos contra la libertad y seguridad individual";
const T_VII = "VII. Delitos contra la libertad e indemnidad sexual";
const T_VIII = "VIII. Delitos contra el honor";
const T_IX = "IX. Delitos contra la propiedad";
const T_X = "X. Delitos contra la fe pública";
const T_XI = "XI. Delitos contra la administración pública";
const T_XII = "XII. Delitos contra la administración de justicia";
const T_XIII = "XIII. Delitos contra la seguridad pública";
const T_XIV = "XIV. Delitos contra la salud pública";
const T_XV = "XV. Delitos y faltas de tránsito";
const T_XVI = "XVI. De las faltas";

export const CODIGO_PENAL: ArticuloPenal[] = [
  { numero: 46, delito: "Homicidio simple", pena: PENA.M1, titulo: T_V },
  { numero: 46.1, delito: "Homicidio Frustrado", pena: PENA.N1, titulo: T_V },
  { numero: 47, delito: "Homicidio calificado", pena: PENA.M2, titulo: T_V },
  { numero: 48, delito: "Parricidio", pena: PENA.M2, titulo: T_V },
  { numero: 49, delito: "Femicidio", pena: PENA.M2, titulo: T_V },
  { numero: 50, delito: "Infanticidio", pena: PENA.M1, titulo: T_V },
  { numero: 51, delito: "Homicidio en riña", pena: PENA.N1, titulo: T_V },
  { numero: 52, delito: "Auxilio al suicidio", pena: PENA.M1, titulo: T_V },
  { numero: 53, delito: "Cuasidelito de homicidio", pena: PENA.N1, titulo: T_V },
  { numero: 54, delito: "Lesiones gravísimas", pena: PENA.M1, titulo: T_V },
  { numero: 55, delito: "Lesiones graves", pena: PENA.N1, titulo: T_V },
  { numero: 56, delito: "Lesiones menos graves", pena: PENA.N2, titulo: T_V },
  { numero: 57, delito: "Lesiones leves", pena: PENA.F1, titulo: T_V },
  { numero: 58, delito: "Cuasidelito de lesiones", pena: PENA.N2, titulo: T_V },
  { numero: 59, delito: "Aborto sin consentimiento", pena: PENA.M1, titulo: T_V },
  { numero: 60, delito: "Aborto con consentimiento", pena: PENA.N2, titulo: T_V },
  { numero: 61, delito: "Omisión de socorro", pena: PENA.N2, titulo: T_V },
  { numero: 62, delito: "Abandono de niño o persona desvalida", pena: PENA.N1, titulo: T_V },
  { numero: 63, delito: "Exposición a peligro", pena: PENA.N2, titulo: T_V },
  { numero: 64, delito: "Trata de personas", pena: PENA.M2, titulo: T_V },
  { numero: 65, delito: "Tráfico ilícito de migrantes", pena: PENA.M1, titulo: T_V },

  { numero: 66, delito: "Secuestro", pena: PENA.M1, titulo: T_VI },
  { numero: 67, delito: "Sustracción de menores", pena: PENA.M1, titulo: T_VI },
  { numero: 68, delito: "Detención ilegal", pena: PENA.N1, titulo: T_VI },
  { numero: 69, delito: "Amenazas simples", pena: PENA.N2, titulo: T_VI },
  { numero: 70, delito: "Amenaza condicional", pena: PENA.N1, titulo: T_VI },
  { numero: 71, delito: "Coacción", pena: PENA.N2, titulo: T_VI },
  { numero: 72, delito: "Violación de domicilio", pena: PENA.N2, titulo: T_VI },
  { numero: 73, delito: "Violación de correspondencia", pena: PENA.N2, titulo: T_VI },
  { numero: 74, delito: "Interceptación ilegal de comunicaciones", pena: PENA.N1, titulo: T_VI },
  { numero: 75, delito: "Discriminación arbitraria", pena: PENA.N1, titulo: T_VI },
  { numero: 76, delito: "Tortura o tratos crueles, inhumanos o degradantes", pena: PENA.M2, titulo: T_VI },
  { numero: 77, delito: "Desaparición forzada de personas", pena: PENA.M2, titulo: T_VI },
  { numero: 78, delito: "Toma de rehenes", pena: PENA.M1, titulo: T_VI },
  { numero: 79, delito: "Privación ilegítima de libertad por funcionario público", pena: PENA.N1, titulo: T_VI },
  { numero: 80, delito: "Allanamiento ilegal", pena: PENA.N1, titulo: T_VI },

  { numero: 81, delito: "Violación", pena: PENA.M2, titulo: T_VII },
  { numero: 82, delito: "Violación de menor de 14 años", pena: PENA.M2, titulo: T_VII },
  { numero: 83, delito: "Estupro", pena: PENA.M1, titulo: T_VII },
  { numero: 84, delito: "Abuso sexual", pena: PENA.N1, titulo: T_VII },
  { numero: 85, delito: "Abuso sexual de menor de 14 años", pena: PENA.M1, titulo: T_VII },
  { numero: 86, delito: "Acoso sexual", pena: PENA.N1, titulo: T_VII },
  { numero: 87, delito: "Exhibicionismo", pena: PENA.N2, titulo: T_VII },
  { numero: 88, delito: "Producción o comercialización de material sexual infantil", pena: PENA.M2, titulo: T_VII },
  { numero: 89, delito: "Tenencia de material sexual infantil", pena: PENA.N1, titulo: T_VII },
  { numero: 90, delito: "Acecho sexual de menores (grooming)", pena: PENA.M1, titulo: T_VII },
  { numero: 91, delito: "Corrupción de menores", pena: PENA.M1, titulo: T_VII },
  { numero: 92, delito: "Explotación de prostitución infantil", pena: PENA.M2, titulo: T_VII },
  { numero: 93, delito: "Incesto", pena: PENA.M1, titulo: T_VII },
  { numero: 94, delito: "Esterilización forzada", pena: PENA.M1, titulo: T_VII },
  { numero: 95, delito: "Acoso sexual callejero", pena: PENA.N2, titulo: T_VII },

  { numero: 96, delito: "Injuria", pena: PENA.N2, titulo: T_VIII },
  { numero: 97, delito: "Injuria agravada (con publicidad o por escrito)", pena: PENA.N2, titulo: T_VIII },
  { numero: 98, delito: "Calumnia", pena: PENA.N2, titulo: T_VIII },
  { numero: 99, delito: "Calumnia o injuria por medios de comunicación", pena: PENA.N1, titulo: T_VIII },

  { numero: 100, delito: "Hurto simple", pena: PENA.N2, titulo: T_IX },
  { numero: 101, delito: "Hurto agravado", pena: PENA.N1, titulo: T_IX },
  { numero: 102, delito: "Hurto de hallazgo", pena: PENA.N2, titulo: T_IX },
  { numero: 103, delito: "Robo con fuerza", pena: PENA.N1, titulo: T_IX },
  { numero: 104, delito: "Robo con violencia o intimidación", pena: PENA.M1, titulo: T_IX },
  { numero: 105, delito: "Robo con homicidio", pena: PENA.M2, titulo: T_IX },
  { numero: 106, delito: "Robo con violación", pena: PENA.M2, titulo: T_IX },
  { numero: 107, delito: "Robo con lesiones", pena: PENA.M1, titulo: T_IX },
  { numero: 108, delito: "Robo por sorpresa", pena: PENA.N1, titulo: T_IX },
  { numero: 109, delito: "Extorsión", pena: PENA.M1, titulo: T_IX },
  { numero: 110, delito: "Estafa", pena: PENA.N1, titulo: T_IX },
  { numero: 111, delito: "Otras defraudaciones patrimoniales", pena: PENA.N2, titulo: T_IX },
  { numero: 112, delito: "Apropiación indebida", pena: PENA.N1, titulo: T_IX },
  { numero: 113, delito: "Usurpación de inmuebles", pena: PENA.N1, titulo: T_IX },
  { numero: 114, delito: "Usurpación de aguas", pena: PENA.N2, titulo: T_IX },
  { numero: 115, delito: "Daños simples", pena: PENA.N2, titulo: T_IX },
  { numero: 116, delito: "Daños calificados", pena: PENA.N1, titulo: T_IX },
  { numero: 117, delito: "Abigeato", pena: PENA.N1, titulo: T_IX },
  { numero: 118, delito: "Receptación", pena: PENA.N1, titulo: T_IX },
  { numero: 119, delito: "Acceso no autorizado a sistemas informáticos", pena: PENA.N2, titulo: T_IX },
  { numero: 120, delito: "Sabotaje informático", pena: PENA.N1, titulo: T_IX },
  { numero: 121, delito: "Fraude informático", pena: PENA.N1, titulo: T_IX },
  { numero: 122, delito: "Usura", pena: PENA.N2, titulo: T_IX },

  { numero: 123, delito: "Falsificación de instrumento público", pena: PENA.N1, titulo: T_X },
  { numero: 124, delito: "Falsificación de instrumento privado", pena: PENA.N2, titulo: T_X },
  { numero: 125, delito: "Falsificación de moneda", pena: PENA.M1, titulo: T_X },
  { numero: 126, delito: "Falsificación de timbres y sellos", pena: PENA.N2, titulo: T_X },
  { numero: 127, delito: "Uso malicioso de instrumento falso", pena: PENA.N1, titulo: T_X },
  { numero: 128, delito: "Suplantación de identidad", pena: PENA.N2, titulo: T_X },
  { numero: 129, delito: "Falso testimonio", pena: PENA.N1, titulo: T_X },
  { numero: 130, delito: "Perjurio", pena: PENA.N2, titulo: T_X },

  { numero: 131, delito: "Cohecho", pena: PENA.M1, titulo: T_XI },
  { numero: 132, delito: "Cohecho a funcionario público extranjero", pena: PENA.N1, titulo: T_XI },
  { numero: 133, delito: "Soborno", pena: PENA.N1, titulo: T_XI },
  { numero: 134, delito: "Malversación de caudales públicos", pena: PENA.M1, titulo: T_XI },
  { numero: 135, delito: "Fraude al Fisco", pena: PENA.N1, titulo: T_XI },
  { numero: 136, delito: "Negociación incompatible", pena: PENA.N2, titulo: T_XI },
  { numero: 137, delito: "Tráfico de influencias", pena: PENA.M1, titulo: T_XI },
  { numero: 138, delito: "Exacciones ilegales", pena: PENA.N2, titulo: T_XI },
  { numero: 139, delito: "Prevaricación judicial", pena: PENA.M1, titulo: T_XI },
  { numero: 140, delito: "Prevaricación administrativa", pena: PENA.N1, titulo: T_XI },
  { numero: 141, delito: "Denegación de justicia", pena: PENA.N2, titulo: T_XI },
  { numero: 142, delito: "Usurpación de funciones públicas", pena: PENA.N2, titulo: T_XI },
  { numero: 143, delito: "Abuso de autoridad", pena: PENA.N1, titulo: T_XI },
  { numero: 144, delito: "Nombramientos ilegales", pena: PENA.N2, titulo: T_XI },
  { numero: 145, delito: "Violación de secretos", pena: PENA.N2, titulo: T_XI },
  { numero: 146, delito: "Enriquecimiento ilícito", pena: PENA.M1, titulo: T_XI },
  { numero: 147, delito: "Uso indebido de información privilegiada", pena: PENA.N1, titulo: T_XI },

  { numero: 148, delito: "Obstrucción a la investigación", pena: PENA.N1, titulo: T_XII },
  { numero: 149, delito: "Encubrimiento", pena: PENA.N2, titulo: T_XII },
  { numero: 150, delito: "Fuga de detenidos (facilitación)", pena: PENA.N1, titulo: T_XII },
  { numero: 151, delito: "Favorecimiento culposo de la evasión", pena: PENA.N2, titulo: T_XII },
  { numero: 152, delito: "Quebrantamiento de condena", pena: PENA.N1, titulo: T_XII },
  { numero: 153, delito: "Desacato", pena: PENA.N2, titulo: T_XII },
  { numero: 154, delito: "Denuncia o acusación calumniosa", pena: PENA.N2, titulo: T_XII },
  { numero: 155, delito: "Obstrucción al ejercicio de la defensa", pena: PENA.N2, titulo: T_XII },

  { numero: 156, delito: "Incendio", pena: PENA.M1, titulo: T_XIII },
  { numero: 157, delito: "Estragos", pena: PENA.M1, titulo: T_XIII },
  { numero: 158, delito: "Tenencia ilegal de armas de fuego", pena: PENA.N1, titulo: T_XIII },
  { numero: 159, delito: "Fabricación o tráfico de armas de fuego", pena: PENA.M2, titulo: T_XIII },
  { numero: 160, delito: "Tenencia ilegal de explosivos", pena: PENA.N1, titulo: T_XIII },
  { numero: 161, delito: "Asociación ilícita", pena: PENA.M1, titulo: T_XIII },
  { numero: 162, delito: "Financiamiento del terrorismo", pena: PENA.ESP, titulo: T_XIII },
  { numero: 163, delito: "Amenaza de atentado", pena: PENA.N1, titulo: T_XIII },

  { numero: 164, delito: "Tráfico ilícito de estupefacientes", pena: PENA.ESP, titulo: T_XIV },
  { numero: 165, delito: "Microtráfico", pena: PENA.ESP, titulo: T_XIV },
  { numero: 166, delito: "Suministro de droga a menor de edad", pena: PENA.M1, titulo: T_XIV },
  { numero: 167, delito: "Adulteración de alimentos o medicamentos", pena: PENA.N1, titulo: T_XIV },
  { numero: 168, delito: "Contaminación ambiental grave", pena: PENA.N1, titulo: T_XIV },
  { numero: 169, delito: "Ejercicio ilegal de la profesión médica", pena: PENA.N2, titulo: T_XIV },

  { numero: 170, delito: "Infracciones de tránsito (remisión al Código de Tránsito)", pena: PENA.ESP, titulo: T_XV },
  { numero: 171, delito: "Conducción temeraria", pena: PENA.N2, titulo: T_XV },
  { numero: 172, delito: "Conducción en estado de ebriedad", pena: PENA.N1, titulo: T_XV },
  { numero: 173, delito: "Conducción bajo influencia de estupefacientes", pena: PENA.N1, titulo: T_XV },
  { numero: 174, delito: "Fuga del lugar del accidente", pena: PENA.N1, titulo: T_XV },
  { numero: 175, delito: "Conducción sin licencia", pena: PENA.N2, titulo: T_XV },

  { numero: 176, delito: "Falta: alteración leve del orden público", pena: PENA.F1, titulo: T_XVI },
  { numero: 177, delito: "Falta: injurias leves", pena: PENA.F1, titulo: T_XVI },
  { numero: 178, delito: "Falta: daños de escasa cuantía", pena: PENA.F1, titulo: T_XVI },
  { numero: 179, delito: "Falta: desórdenes en la vía pública en estado de ebriedad", pena: PENA.F1, titulo: T_XVI },
  { numero: 180, delito: "Falta: porte ostensible de arma blanca", pena: PENA.F1, titulo: T_XVI },
  { numero: 181, delito: "Falta: ofensas leves a un funcionario público", pena: PENA.F1, titulo: T_XVI },
  { numero: 182, delito: "Falta: ocupación ilegítima de bien nacional de uso público", pena: PENA.F1, titulo: T_XVI },
  { numero: 183, delito: "Falta: maltrato animal (sin muerte ni lesiones graves)", pena: PENA.F1, titulo: T_XVI },
];

export function articuloPorNumero(numero: number): ArticuloPenal | undefined {
  return CODIGO_PENAL.find((a) => a.numero === numero);
}

/** Agrupa el catálogo por título, en el mismo orden en que aparecen en el Código. */
export function codigoPenalPorTitulo(): { titulo: string; articulos: ArticuloPenal[] }[] {
  const titulos: string[] = [];
  const mapa = new Map<string, ArticuloPenal[]>();
  for (const art of CODIGO_PENAL) {
    if (!mapa.has(art.titulo)) {
      mapa.set(art.titulo, []);
      titulos.push(art.titulo);
    }
    mapa.get(art.titulo)!.push(art);
  }
  return titulos.map((titulo) => ({ titulo, articulos: mapa.get(titulo)! }));
}
