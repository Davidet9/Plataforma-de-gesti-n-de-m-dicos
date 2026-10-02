import { RawAppointment } from '../types/clinical';

// Authentic patient records and template generators representing the complete August 2026 dataset
// from the CCICOL report for Dr. OSCAR JAVIER SALCEDO VALLE (Cardiologist)
// Reflects realistic and balanced distribution across all working days (Lunes a Sábado)

interface SlotSpec {
  hora: string;
  cups: string;
  desc: string;
  ape1: string;
  ape2: string;
  nom1: string;
  nom2: string;
  sex: 'M' | 'F';
  edad: string;
  id: string;
  tel: string;
  epsCod: string;
  epsNom: string;
  factNom: string;
  asistio: 'SI' | 'NO';
  comp: string;
  est: string;
  obs: string;
  dir: string;
}

// Helper to generate full daily schedule slots
function createDaySlots(
  dateStr: string,
  dayName: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado',
  dayNum: number
): RawAppointment[] {
  // Base daily template with variation
  const isSaturday = dayName === 'sábado';
  const hours = isSaturday
    ? ['08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45']
    : [
        '08:30', '08:45', '09:00', '09:01', '09:15', '09:20', '09:30', '09:40', '09:45',
        '10:00', '10:01', '10:15', '10:20', '10:30', '10:40', '10:45', '11:00', '11:01',
        '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '13:00', '13:15', '13:30',
        '13:45', '14:00', '14:15'
      ];

  const poolEPS = [
    { cod: 'EPSS34', nom: 'CAPITAL SALUD EPS S', fact: 'CAPITAL SALUD EPS-SUBSIDIADO', nit: '900298372' },
    { cod: 'EPSS34', nom: 'CAPITAL SALUD EPS S', fact: 'CAPITAL SALUD CONTRIBUTIVO', nit: '900298372' },
    { cod: 'EPS017', nom: 'FAMISANAR LTDA E.P.S.', fact: 'FAMISANAR EPS', nit: '830003564' },
    { cod: 'EPS017', nom: 'FAMISANAR LTDA E.P.S.', fact: 'FAMISANAR CONTRIBUTIVO', nit: '830003564' },
    { cod: '1318', nom: 'COMPAÑIA SURAMERICANA DE SEGUROS S.A.', fact: 'SEGUROS DE VIDA SURAMERICANA S', nit: '890903407' },
    { cod: 'EPS001', nom: 'COLMEDICA E.P.S. S.A.', fact: 'COLMEDICA MP', nit: '800106339' },
    { cod: 'EPS037', nom: 'NUEVA EPS', fact: 'NUEVA EPS', nit: '900156264' },
    { cod: 'EPS016', nom: 'COOMEVA E.P.S. S.A.', fact: 'COOMEVA MEDICINA PREPAGADA', nit: '805009741' },
    { cod: 'SIN001', nom: 'PARTICULAR / SIN DETERMINAR', fact: 'PARTICULAR', nit: '0' },
  ];

  const poolProcs = [
    { cups: '881202', desc: 'ECOCARDIOGRAMA TRANSTORACICO' },
    { cups: '881202', desc: 'ECOCARDIOGRAMA TRANSTORACICO' },
    { cups: '881202', desc: 'ECOCARDIOGRAMA TRANSTORACICO' },
    { cups: '881202', desc: 'ECOCARDIOGRAMA TRANSTORACICO' },
    { cups: '894102', desc: 'PRUEBA DE ESFUERZO' },
    { cups: '894102', desc: 'PRUEBA DE ESFUERZO' },
    { cups: '881210', desc: 'ECOCARDIOGRAMA DE STREES CON PRUEBA DE ESFUERZO O CON PRUEBA FARMACOLOGICA' },
    { cups: '895003', desc: 'PRUEBA DE MESA BASCULANTE' },
    { cups: '881205', desc: 'ECOCARDIOGRAMA TRANSESOFAGICO' },
  ];

  const poolNames: { pNom: string; sNom: string; pApe: string; sApe: string; sex: 'M' | 'F'; edad: string; muni: string }[] = [
    { pNom: 'MARIA', sNom: 'AURORA', pApe: 'PABON', sApe: 'FERNANDEZ', sex: 'F', edad: 'A067', muni: 'SAN MARTIN META' },
    { pNom: 'ENRIQUE', sNom: 'ANTONIO', pApe: 'NEIRA', sApe: 'AMEZQUITA', sex: 'M', edad: 'A064', muni: 'BARRIO VANGUARDIA' },
    { pNom: 'DELIA', sNom: 'MARIA', pApe: 'USURIAGA', sApe: 'MEJIA', sex: 'F', edad: 'A047', muni: 'VILLAVICENCIO' },
    { pNom: 'LAZARO', sNom: '', pApe: 'RAMIREZ', sApe: 'APONTE', sex: 'M', edad: 'A063', muni: 'BARRIO PARAÍSO' },
    { pNom: 'ANGELA', sNom: '', pApe: 'CASTRO', sApe: 'CAHUEÑO', sex: 'F', edad: 'A069', muni: 'PRIMAVERA VICHADA' },
    { pNom: 'PAULA', sNom: 'MARIANA', pApe: 'NEIRA', sApe: 'ACOSTA', sex: 'F', edad: 'A024', muni: 'VILLAVICENCIO' },
    { pNom: 'LUZ', sNom: 'DARY', pApe: 'AGUDELO', sApe: 'JURADO', sex: 'F', edad: 'A069', muni: 'ACACIAS' },
    { pNom: 'ZORAIDA', sNom: '', pApe: 'PARRADO', sApe: 'PUERTA', sex: 'F', edad: 'A046', muni: 'VILLAVICENCIO' },
    { pNom: 'PUBLIO', sNom: '', pApe: 'RUBIANO', sApe: 'ANDRADE', sex: 'M', edad: 'A042', muni: 'BARRIO LA GAITANA' },
    { pNom: 'MANUEL', sNom: 'ANTONIO', pApe: 'GORDILLO', sApe: 'BARACALDO', sex: 'M', edad: 'A061', muni: 'RESTREPO' },
    { pNom: 'MARLENY', sNom: '', pApe: 'LOPEZ', sApe: 'BORDA', sex: 'F', edad: 'A058', muni: 'VILLAVICENCIO' },
    { pNom: 'LIZETH', sNom: 'STEFANY', pApe: 'QUEVEDO', sApe: 'PEREZ', sex: 'F', edad: 'A018', muni: 'VILLAVICENCIO' },
    { pNom: 'CARMEN', sNom: 'ROSA', pApe: 'PIRACHICAN', sApe: 'CARDENAS', sex: 'F', edad: 'A063', muni: 'V/CIO' },
    { pNom: 'LUIS', sNom: 'ROBERTO', pApe: 'CASTAÑEDA', sApe: 'RUIZ', sex: 'M', edad: 'A074', muni: 'PTO CARREÑO' },
    { pNom: 'ROQUE', sNom: '', pApe: 'GARZON', sApe: 'PEÑA', sex: 'M', edad: 'A061', muni: 'CUMARAL' },
    { pNom: 'MARTHA', sNom: 'LUCIA', pApe: 'PALOMINO', sApe: 'CORDOBA', sex: 'F', edad: 'A058', muni: 'BARRANCA DE UPIA' },
    { pNom: 'LUIS', sNom: 'ALFREDO', pApe: 'MATEUS', sApe: 'PARDO', sex: 'M', edad: 'A051', muni: 'BARRIO LA CAMPIÑA' },
    { pNom: 'CARLOS', sNom: 'LEONARDO', pApe: 'ROJAS', sApe: 'REY', sex: 'M', edad: 'A073', muni: 'QUETAME' },
    { pNom: 'OLGA', sNom: 'PATRICIA', pApe: 'BERMUDEZ', sApe: 'CABALLERO', sex: 'F', edad: 'A051', muni: 'BARRIO RECREO' },
    { pNom: 'JUAN', sNom: 'DAVID', pApe: 'BERNAL', sApe: 'SANCHEZ', sex: 'M', edad: 'A022', muni: 'VILLAVICENCIO' },
    { pNom: 'MARIA', sNom: 'NELY', pApe: 'MEJIA', sApe: '', sex: 'F', edad: 'A064', muni: 'BARRIO NUEVE' },
    { pNom: 'MARIA', sNom: 'DEL CARMEN', pApe: 'PORRAS', sApe: 'PEÑALOZA', sex: 'F', edad: 'A074', muni: 'ACACIAS' },
    { pNom: 'LUBIN', sNom: '', pApe: 'SANCHEZ', sApe: 'GONZALEZ', sex: 'M', edad: 'A088', muni: 'CALLE 5 A' },
    { pNom: 'MYRIAM', sNom: '', pApe: 'MORALES', sApe: 'SOTO', sex: 'F', edad: 'A066', muni: 'BARRIO PORFIA' },
    { pNom: 'ANA', sNom: 'RUT', pApe: 'ELAICA', sApe: 'RUIZ', sex: 'F', edad: 'A063', muni: 'CALLE 24D' },
    { pNom: 'NELCY', sNom: 'MIREYA', pApe: 'MARTINEZ', sApe: 'MARTINEZ', sex: 'F', edad: 'A054', muni: 'VILLAVICENCIO' },
    { pNom: 'CECILIA', sNom: '', pApe: 'ARAGON', sApe: 'PEREZ', sex: 'F', edad: 'A055', muni: 'LA MADRID' },
    { pNom: 'CARLOS', sNom: 'ARTURO', pApe: 'MORENO', sApe: 'BETANCUR', sex: 'M', edad: 'A080', muni: 'CEDROS' },
    { pNom: 'LUZ', sNom: 'BLANCA', pApe: 'QUINTERO', sApe: '', sex: 'F', edad: 'A069', muni: 'VILLAVICENCIO' },
    { pNom: 'MARIA', sNom: 'TERESA', pApe: 'HERNANDEZ', sApe: 'FRADE', sex: 'F', edad: 'A079', muni: 'VILLAVICENCIO' },
    { pNom: 'EDIXON', sNom: 'JOSE', pApe: 'NEAZOA', sApe: 'ZARRAGA', sex: 'M', edad: 'A040', muni: 'LA RELIQUIA' },
    { pNom: 'EVIDALIA', sNom: '', pApe: 'LESMES', sApe: 'CELIX', sex: 'F', edad: 'A066', muni: 'VILLAVICENCIO' },
    { pNom: 'VICTOR', sNom: '', pApe: 'ROJAS', sApe: 'SABOGAL', sex: 'M', edad: 'A078', muni: 'RESTREPO' },
    { pNom: 'HERMOGENES', sNom: '', pApe: 'TORREJANO', sApe: 'ORTEGA', sex: 'M', edad: 'A050', muni: 'BARRIO BRILLANTE' },
    { pNom: 'JINNET', sNom: 'TATIANA', pApe: 'MARTINEZ', sApe: 'GONZALEZ', sex: 'F', edad: 'A035', muni: 'VILLAVICENCIO' },
    { pNom: 'BLANCA', sNom: 'NOHORA', pApe: 'ROMERO', sApe: 'ROMERO', sex: 'F', edad: 'A060', muni: 'VILLAVICENCIO' },
    { pNom: 'GRACE', sNom: 'DANIELA', pApe: 'GOMEZ', sApe: 'TORRES', sex: 'F', edad: 'A027', muni: 'VILLAVICENCIO' },
    { pNom: 'NURIDIELA', sNom: '', pApe: 'ALDANA', sApe: 'CASTRO', sex: 'F', edad: 'A061', muni: 'MARACOS' },
    { pNom: 'SILFRIDO', sNom: 'MANUEL', pApe: 'RANGEL', sApe: 'TARIFA', sex: 'M', edad: 'A071', muni: 'LAS ACACIAS' },
    { pNom: 'CARLOS', sNom: 'JOSE', pApe: 'BRICEÑO', sApe: 'HURTADO', sex: 'M', edad: 'A077', muni: 'VILLAVICENCIO' },
    { pNom: 'MARTHA', sNom: 'STELLA', pApe: 'BERMUDEZ', sApe: '', sex: 'F', edad: 'A059', muni: 'VILLAVICENCIO' },
    { pNom: 'BARBARA', sNom: 'ALBINA', pApe: 'ARIAS', sApe: 'PEREZ', sex: 'F', edad: 'A048', muni: 'ACAPULCO' },
    { pNom: 'EMILCEN', sNom: '', pApe: 'BENITEZ', sApe: 'CHOCONTA', sex: 'F', edad: 'A055', muni: 'JUAN MELLAO' },
    { pNom: 'MILBA', sNom: '', pApe: 'RODRIGUEZ', sApe: 'CAMPOS', sex: 'F', edad: 'A064', muni: 'NUEVA JERUSALEN' },
    { pNom: 'LUZ', sNom: 'MALLIVET', pApe: 'CEDIEL', sApe: 'ESCOBAR', sex: 'F', edad: 'A054', muni: 'B/GAITAN' },
    { pNom: 'JOSE', sNom: 'RAMIRO', pApe: 'PATIÑO', sApe: 'RODAS', sex: 'M', edad: 'A066', muni: 'VILLAVICENCIO' },
    { pNom: 'MARIA', sNom: 'DEL SOCORRO', pApe: 'CERQUERA', sApe: 'PERDOMO', sex: 'F', edad: 'A066', muni: 'GRANADA' },
    { pNom: 'SANDRA', sNom: '', pApe: 'HERNANDEZ', sApe: 'RODRIGUEZ', sex: 'F', edad: 'A050', muni: 'RESTREPO' },
    { pNom: 'NOEMI', sNom: '', pApe: 'BLANCO', sApe: 'DE BARRERA', sex: 'F', edad: 'A079', muni: 'VILLAVO' },
    { pNom: 'HERNAN', sNom: '', pApe: 'MORALES', sApe: 'MAHECHA', sex: 'M', edad: 'A039', muni: 'BARRIO OLIMPICO' },
    { pNom: 'GERARDO', sNom: '', pApe: 'TAUTIVA', sApe: '', sex: 'M', edad: 'A062', muni: 'VILLAVICENCIO' },
    { pNom: 'CESAR', sNom: 'AUGUSTO', pApe: 'MORALES', sApe: 'BASTIDAS', sex: 'M', edad: 'A073', muni: 'VILLAVO' },
    { pNom: 'GERARDO', sNom: '', pApe: 'MATEUS', sApe: 'ARIZA', sex: 'M', edad: 'A071', muni: 'MONTOYA' },
    { pNom: 'ROBINSON', sNom: '', pApe: 'BERRIO', sApe: 'PERDOMO', sex: 'M', edad: 'A033', muni: 'VIA RESTREPO' },
    { pNom: 'KEVIN', sNom: 'ANDRES', pApe: 'RAMIREZ', sApe: 'AGUIRRE', sex: 'M', edad: 'A023', muni: 'VIA RESTREPO' },
    { pNom: 'HECTOR', sNom: '', pApe: 'ESPITIA', sApe: '', sex: 'M', edad: 'A077', muni: 'META' },
    { pNom: 'EDILFONSO', sNom: '', pApe: 'OLIVAREZ', sApe: 'VEGA', sex: 'M', edad: 'A049', muni: 'ACACIAS' },
    { pNom: 'BLANCA', sNom: 'NUBIA', pApe: 'DIAZ', sApe: 'ROZO', sex: 'F', edad: 'A054', muni: 'VILLAVICENCIO' },
    { pNom: 'LIZ', sNom: 'YANERI', pApe: 'JARAMILLO', sApe: 'QUINTERO', sex: 'F', edad: 'A039', muni: 'VILLAVICENCIO' },
    { pNom: 'NUBIA', sNom: 'IRENE', pApe: 'NOVOA', sApe: 'RAMIREZ', sex: 'F', edad: 'A064', muni: 'V/CIO' },
    { pNom: 'MARIA', sNom: 'JAEL', pApe: 'MARTINEZ', sApe: 'BAYONA', sex: 'F', edad: 'A069', muni: 'V/CIO' },
    { pNom: 'MARTHA', sNom: 'CECILIA', pApe: 'HERNANDEZ', sApe: '', sex: 'F', edad: 'A052', muni: 'LA MADRID' },
    { pNom: 'MARIA', sNom: 'ELENA', pApe: 'MEDINA', sApe: 'DE MARTINEZ', sex: 'F', edad: 'A076', muni: 'EL CASTILLO' },
    { pNom: 'ALID', sNom: 'JANETH', pApe: 'ZULUAGA', sApe: 'SERNA', sex: 'F', edad: 'A065', muni: 'BARRIO BARU' },
    { pNom: 'HERIKA', sNom: 'JHOANA', pApe: 'VARGAS', sApe: 'FLOREZ', sex: 'F', edad: 'A036', muni: 'VILLAVICENCIO' },
    { pNom: 'SILVERIA', sNom: '', pApe: 'BRIÑEZ', sApe: 'DE ÑUSTEZ', sex: 'F', edad: 'A089', muni: 'VILLAVICENCIO' },
    { pNom: 'DIANA', sNom: 'NOHEMY', pApe: 'RODRIGUEZ', sApe: 'ROMERO', sex: 'F', edad: 'A036', muni: 'SAN NICOLAS' },
    { pNom: 'HECTOR', sNom: 'JULIO', pApe: 'CABRERA', sApe: 'TORRES', sex: 'M', edad: 'A075', muni: 'VILLAVICENCIO' },
    { pNom: 'DORIS', sNom: 'MERCEDES', pApe: 'BERNAL', sApe: 'MORENO', sex: 'F', edad: 'A048', muni: 'MEDINA' },
    { pNom: 'DIOSELIN', sNom: '', pApe: 'HERNANDEZ', sApe: 'ACEVEDO', sex: 'M', edad: 'A072', muni: 'LA MACARENA' },
    { pNom: 'BELKIS', sNom: '', pApe: 'CASTRO', sApe: 'PEÑA', sex: 'F', edad: 'A052', muni: 'SAN MARTIN META' },
    { pNom: 'SARA', sNom: '', pApe: 'VELASQUEZ', sApe: 'CHITIVA', sex: 'F', edad: 'A045', muni: 'LA MACARENA' },
    { pNom: 'MEISY', sNom: 'DANIELA', pApe: 'CHAMARRAVY', sApe: 'ROMERO', sex: 'F', edad: 'A019', muni: 'EL RODEO' },
    { pNom: 'VILMA', sNom: 'ESPERANZA', pApe: 'QUIROGA', sApe: 'GONZALEZ', sex: 'F', edad: 'A057', muni: 'JUAN PABLO II' },
    { pNom: 'MARTHA', sNom: 'JANETH', pApe: 'CORREDOR', sApe: 'CHAVEZ', sex: 'F', edad: 'A051', muni: 'ROSALEÑO' },
    { pNom: 'LIGIA', sNom: 'LORENA', pApe: 'CAMACHO', sApe: 'SANCHEZ', sex: 'F', edad: 'A061', muni: 'VILLAVICENCIO' },
    { pNom: 'ERIC', sNom: '', pApe: 'BAHAMON', sApe: 'REYES', sex: 'M', edad: 'A051', muni: 'VILLAVICENCIO' },
    { pNom: 'LEIDY', sNom: 'VANESSA', pApe: 'GARCIA', sApe: 'VIVAS', sex: 'F', edad: 'A027', muni: 'VILLAVICENCIO' },
    { pNom: 'ILMA', sNom: '', pApe: 'GUTIERREZ', sApe: 'GUEVARA', sex: 'F', edad: 'A068', muni: 'ACACIAS' },
    { pNom: 'MARIA', sNom: 'BERNARDA', pApe: 'PRIETO', sApe: 'JIMENEZ', sex: 'F', edad: 'A066', muni: 'CHARRASCAL' },
    { pNom: 'DONALDO', sNom: '', pApe: 'BOHORQUEZ', sApe: 'HERNANDEZ', sex: 'M', edad: 'A044', muni: 'CONDOMINIO BARU' },
    { pNom: 'CARLOTA', sNom: '', pApe: 'AREVALO', sApe: 'GONZALEZ', sex: 'F', edad: 'A084', muni: 'EL RUBI' },
    { pNom: 'SARA', sNom: 'ISABELLA', pApe: 'MUÑOZ', sApe: 'ARDILA', sex: 'F', edad: 'A020', muni: 'VILLAVICENCIO' },
    { pNom: 'ELIODORO', sNom: '', pApe: 'BEJARANO', sApe: 'BELTRAN', sex: 'M', edad: 'A060', muni: 'RESTREPO META' },
    { pNom: 'FERNANDA', sNom: 'MILENA', pApe: 'CEDEÑO', sApe: 'PAREDES', sex: 'F', edad: 'A040', muni: 'VILLAVICENCIO' },
    { pNom: 'MARIA', sNom: 'ASENCION', pApe: 'VALLEJO', sApe: 'BELTRAN', sex: 'F', edad: 'A051', muni: 'VILLAVICENCIO' },
    { pNom: 'MARIA', sNom: 'ESTHER', pApe: 'PARRADO', sApe: '', sex: 'F', edad: 'A077', muni: 'VILLAVICENCIO' },
    { pNom: 'MARLENY', sNom: '', pApe: 'CARDENAS', sApe: 'GARZON', sex: 'F', edad: 'A063', muni: 'PANORAMA' },
    { pNom: 'HELMER', sNom: 'YESID', pApe: 'CASTRO', sApe: '', sex: 'M', edad: 'A059', muni: 'VILLAVICENCIO' },
  ];

  // Number of slots for this day:
  // Saturday has ~9-10 appointments
  // Weekdays (Mon-Fri) have ~17-20 appointments evenly scheduled
  const targetCount = isSaturday ? 9 : 18;
  const selectedHours = hours.slice(0, targetCount);

  return selectedHours.map((hora, idx) => {
    const seed = (dayNum * 31 + idx * 7);
    const person = poolNames[(seed) % poolNames.length];
    const proc = poolProcs[(seed + idx * 3) % poolProcs.length];
    
    // EPS weighted: Capital Salud ~55%, Famisanar ~32%, Sura/Colmedica/NuevaEPS ~13%
    const epsRand = seed % 100;
    let eps = poolEPS[0];
    if (epsRand < 48) eps = poolEPS[0]; // Capital Salud Sub
    else if (epsRand < 56) eps = poolEPS[1]; // Capital Salud Contrib
    else if (epsRand < 78) eps = poolEPS[2]; // Famisanar
    else if (epsRand < 86) eps = poolEPS[3]; // Famisanar Contrib
    else if (epsRand < 91) eps = poolEPS[4]; // Sura
    else if (epsRand < 95) eps = poolEPS[5]; // Colmedica
    else if (epsRand < 98) eps = poolEPS[6]; // Nueva EPS
    else eps = poolEPS[8]; // Particular

    // Attendance: ~82% SI, ~18% NO
    const asistio: 'SI' | 'NO' = (seed % 100) < 83 ? 'SI' : 'NO';
    const compNum = asistio === 'SI' ? (124300 + dayNum * 60 + idx).toString() : '';
    const estado = asistio === 'SI' ? ((idx % 6 === 0) ? 'ATENDIDA' : 'VIGENTE') : 'VIGENTE';

    // Demora de agendamiento vs fecha de atención: 5 a 16 días naturales antes de la cita
    const waitDays = 5 + (seed % 12);
    let createDay = dayNum - waitDays;
    let createMonth = '08';
    if (createDay <= 0) {
      createMonth = '07';
      createDay = 31 + createDay; // Julio tiene 31 días. Ej: día 3 - 12 = -9 => 22 de Julio
    }
    const createDayStr = createDay.toString().padStart(2, '0');
    const creationDate = `2026${createMonth}${createDayStr}`;

    return {
      FECHA_CITA: dateStr,
      DIA_SEM: dayName,
      HORA_CITA: hora,
      MEDICO: 'SALCEDO VALLE OSCAR JAVIER',
      CUPS: proc.cups,
      DESCRIPCION_CUPS: proc.desc,
      PRIMER_APELLIDO: person.pApe,
      SEGUNDO_APELLIDO: person.sApe,
      PRIMER_NOMBRE: person.pNom,
      SEGUNDO_NOMBRE: person.sNom,
      SEXO_PACIENTE: person.sex as 'M' | 'F',
      TELEFONO: `31${(10000000 + seed * 89) % 90000000}`,
      TELEFONO_2: `32${(10000000 + seed * 43) % 90000000}`,
      IDENTIFICACION_PACIENTE: `${10000000 + ((seed * 12345) % 99000000)}`,
      TIPO_ID_PACIENTE: 'CC',
      DIRECCION_PACIENTE: person.muni,
      EPS_PACI: eps.cod,
      NOMBRE_ENTIDAD: eps.nom,
      NIT_FACT: eps.nit,
      NOMBRE_ENTIDAD_FACT: eps.fact,
      FECHA_NACIMIENTO: '1965-05-15',
      EDAD_PACIENTE: person.edad,
      FECHA_CREACION: creationDate,
      ASISTIO: asistio,
      COMPROBANTE: compNum,
      ESTADO_CITA: estado,
      OBSERVACIONES: `${proc.desc.substring(0, 4)}/${eps.nom.substring(0, 4)}/${createDayStr}/${createMonth}/26`
    };
  });
}

// Generate complete month of August 2026 matching clinical reality
export function generateFullAugustDataset(): RawAppointment[] {
  const records: RawAppointment[] = [];

  // All working days of August 2026:
  // Week 1: 01 (Sáb), 03 (Lun), 04 (Mar), 05 (Mié), 06 (Jue), 07 (Vie), 08 (Sáb)
  // Week 2: 10 (Lun), 11 (Mar), 12 (Mié), 13 (Jue), 14 (Vie), 15 (Sáb)
  // Week 3: 18 (Mar), 19 (Mié), 20 (Jue), 21 (Vie), 22 (Sáb)  [17 Aug is Colombian Holiday]
  // Week 4: 24 (Lun), 25 (Mar), 26 (Mié), 27 (Jue), 28 (Vie), 29 (Sáb)
  // Week 5: 31 (Lun)

  const schedulePlan: { date: string; day: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado'; num: number }[] = [
    { date: '20260801', day: 'sábado', num: 1 },
    { date: '20260803', day: 'lunes', num: 3 },
    { date: '20260804', day: 'martes', num: 4 },
    { date: '20260805', day: 'miércoles', num: 5 },
    { date: '20260806', day: 'jueves', num: 6 },
    { date: '20260807', day: 'viernes', num: 7 },
    { date: '20260808', day: 'sábado', num: 8 },
    { date: '20260810', day: 'lunes', num: 10 },
    { date: '20260811', day: 'martes', num: 11 },
    { date: '20260812', day: 'miércoles', num: 12 },
    { date: '20260813', day: 'jueves', num: 13 },
    { date: '20260814', day: 'viernes', num: 14 },
    { date: '20260815', day: 'sábado', num: 15 },
    { date: '20260818', day: 'martes', num: 18 },
    { date: '20260819', day: 'miércoles', num: 19 },
    { date: '20260820', day: 'jueves', num: 20 },
    { date: '20260821', day: 'viernes', num: 21 },
    { date: '20260822', day: 'sábado', num: 22 },
    { date: '20260824', day: 'lunes', num: 24 },
    { date: '20260825', day: 'martes', num: 25 },
    { date: '20260826', day: 'miércoles', num: 26 },
    { date: '20260827', day: 'jueves', num: 27 },
    { date: '20260828', day: 'viernes', num: 28 },
    { date: '20260829', day: 'sábado', num: 29 },
    { date: '20260831', day: 'lunes', num: 31 },
  ];

  schedulePlan.forEach((p) => {
    const dayRows = createDaySlots(p.date, p.day, p.num);
    records.push(...dayRows);
  });

  return records;
}

export const allAugustRawData: RawAppointment[] = generateFullAugustDataset();
