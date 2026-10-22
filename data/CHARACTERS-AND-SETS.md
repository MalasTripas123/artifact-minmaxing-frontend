# Estadísticas de personajes y bonos de sets

Estos datos viven en `catalog.json → generated` y se exportan también a
`generated/game.json`. Las funciones de consulta son puras: **no se conectan al
escaneo, no reemplazan valores de Enka y no modifican la presentación actual**.

## Personajes

Se cubren los **156 IDs y variantes del catálogo** (124 IDs base). Cada entrada
de `generated.characters[id]` conserva sus nombres, talentos e imágenes y añade:

| Campo | Contenido |
| --- | --- |
| `rarity`, `weaponType` | Rareza y clase de arma |
| `statsBaseId`, `statsSkillDepotId` | Identidad de origen y variante comprobada |
| `progression.baseStats` | Vida, ATQ y DEF iniciales y sus curvas |
| `progression.innateStats` | Probabilidad crítica, daño crítico, Recarga y Maestría Elemental innatos |
| `progression.ascensions[0..6]` | Rango válido de niveles y bonos acumulados de cada ascensión |
| `progression.normalMaxLevel` | Límite de progresión normal: 90 |
| `progression.extraLevels` | Saltos de 90 a 95 y de 95 a 100, conservando ascensión 6 |
| `progression.maxLevel` | Límite con extensiones: 100 |
| `generated.characterCurves` | Multiplicadores por nivel, compartidos entre personajes |
| `generated.characterStatsSource` | Versión fijada y hashes de las fuentes |

Para cada propiedad se calcula:

```text
crecimiento = valorInicial × curva[nivel]
total = crecimiento + bonoAcumuladoDeAscensión + valorInnato
```

El bono especial de ascensión está incluido: por ejemplo, daño crítico de
Ayaka, ATQ % del Viajero o bono de curación de Qiqi. Los porcentajes se guardan
como fracciones (`0.384 = 38.4 %`). El `1` de Recarga innata significa 100 %;
no debe tratarse como un bono adicional de 100 %. Los valores se conservan sin
redondear. Las propiedades no representadas no aportan un incremento a este
desglose.

La Maestría Elemental innata se importa del campo `elementMastery` de la fuente,
con cero cuando el campo está omitido. Néfer tiene 100 y Lauma 200 desde nivel 1;
estos valores se mantienen con el nivel y se suman al bono de ascensión por
separado. Por ejemplo, Lauma a nivel 90/ascensión 6 tiene 315,2 de Maestría sin
equipo: 200 innatos + 115,2 de ascensión.

```js
import { characterStatsAtLevel } from '../script/domain/character-stats.js';

const g = catalog.generated;
const ayaka = characterStatsAtLevel(g.characters['10000002'], g.characterCurves, 90, 6);
// ayaka.total:
//   FIGHT_PROP_BASE_HP:     12858.206654
//   FIGHT_PROP_BASE_ATTACK: 342.0250874
//   FIGHT_PROP_BASE_DEFENSE:783.9254574
//   FIGHT_PROP_CRITICAL:    0.05
//   FIGHT_PROP_CRITICAL_HURT: 0.884  (0.5 innato + 0.384 ascensión)
//   FIGHT_PROP_CHARGE_EFFICIENCY: 1
// También devuelve growth, ascension e innate por separado.

const ascended20 = characterStatsAtLevel(g.characters['10000002'], g.characterCurves, 20, 1);
const unascended20 = characterStatsAtLevel(g.characters['10000002'], g.characterCurves, 20, 0);
const level100 = characterStatsAtLevel(g.characters['10000002'], g.characterCurves, 100, 6);
```

Nivel y ascensión son obligatorios: 20/20 y 20/40 producen estadísticas distintas.
Los límites especiales son saltos a 95 y 100; la consulta rechaza estados no
obtenibles como 91/ascensión 6 o 100/ascensión 5. Las curvas fuente completas
hasta 100 quedan disponibles para inspección. Los saltos se importan de
`AvatarExtraLevelExcelConfigData`; concuerdan con la
[descripción oficial de la ampliación de nivel](https://genshin.hoyoverse.com/en/news/detail/159349).

Las variantes del Viajero y de los Manekines conservan sus identidades y
elementos existentes, pero usan la misma progresión base que su personaje,
según la fuente. Se comprueba que cada skill depot pertenece al personaje.

**Alcance:** estadísticas de crecimiento, valores innatos y ascensión. No incluye
bonos de talentos pasivos, constelaciones, modos de combate, mejoras especiales,
armas, artefactos, resonancias ni compañeros. Por ejemplo, no aplica la reducción
de crítico del talento pasivo de Kokomi. El resultado es la base para cálculos
posteriores, no una reconstrucción del total visible en Enka.

## Sets de artefactos

`generated.artifactSets[id]` contiene los **65 sets presentes en Enka**, con nombres
ES/EN y `bonuses`, una lista de umbrales de piezas. Se preservan los IDs históricos
de la fuente; la pertenencia al catálogo no certifica su disponibilidad actual.
Los nombres existentes en `artifactSetsByLocale` permanecen intactos.

Cada bono contiene:

- `pieces`: cantidad necesaria, normalmente 2/4; las coronas de plegarias usan 1.
- `descriptions.es/en`: texto completo del bono.
- `sourceAffixId`, `descriptionHash`, `ability`, `parameters`: trazabilidad de origen.
- `effects`: efectos tipados; porcentajes como fracciones y cantidades planas en puntos.
- `effectCoverage`: `complete`, `partial` o `description-only`.

Los **60 bonos de dos piezas** y los **5 bonos de una pieza** están modelados
completamente. Todos los bonos de cuatro piezas tienen descripción y parámetros;
sus habilidades complejas aún no se interpretan en general. Su cobertura se
declara explícitamente, de modo que una lista vacía de efectos no significa
erróneamente que el set no tenga bono.

| `kind` | Uso |
| --- | --- |
| `stat` | Incremento de una propiedad general `FIGHT_PROP_*` |
| `damageBonus` | Bono limitado a ataques normales, cargados, descendentes, habilidad, definitiva o todos |
| `energyRestore` | Recuperación de energía ante un disparador; no es Recarga de Energía |
| `statusDurationReduction` | Reducción de duración de un estado elemental; no es resistencia elemental |

`activation` distingue `always`, `conditional` y `triggered`. Los efectos
condicionales tienen `conditions`; los efectos que se disparan con un evento
tienen `trigger`. La lista de condiciones se interpreta como conjunción: todas
deben cumplirse.

Ejemplos importantes:

- Gladiador x2: `FIGHT_PROP_ATTACK_PERCENT = 0.18`.
- Aventurero x2: `FIGHT_PROP_HP = 1000`, incremento plano de Vida.
- Emblema x2: `FIGHT_PROP_CHARGE_EFFICIENCY = 0.20`.
- Ritual Antiguo de la Nobleza x2: daño de definitiva +20 %; no daño global.
- Cazador Fantasmal x2: daño de ataques normales/cargados +15 %.
- Códice de Obsidiana x2: daño +15 %, condicionado a bendición noctámbula y estar en campo.
- Pergamino del Héroe de la Ciudad de las Cenizas x2: recupera 6 puntos de energía
  cuando un miembro cercano del equipo activa una explosión noctámbula.

```js
import { artifactSetBonuses } from '../script/domain/artifact-set-bonuses.js';

const result = artifactSetBonuses(catalog.generated.artifactSets, {
  15001: 2, // Gladiador
  15019: 2, // Reminiscencia de la Purificación
});
// result.stats.FIGHT_PROP_ATTACK_PERCENT === 0.36

const fourPiece = artifactSetBonuses(catalog.generated.artifactSets, { 15001: 4 });
// Incluye una sola vez el bono x2 y reconoce el umbral x4.
// El x4 se señala en unmodelled porque requiere interpretación adicional.
```

Los conteos se pasan por ID, no por nombre traducido. Se valida que sean enteros
no negativos y que no excedan cinco piezas en total. IDs desconocidos producen
un error explícito. Cuatro o cinco piezas activan cada umbral una sola vez;
mezclas 2+2 suman los bonos de sets diferentes aunque mejoren el mismo atributo.

El resultado separa `stats`, `scoped`, `conditional`, `activeBonuses` y
`unmodelled`. Solo `stat` con activación `always` se suma a `stats`; un futuro
calculador de daño debe aplicar los efectos de `scoped` a los ataques indicados,
y un futuro evaluador de contexto deberá resolver `conditional`.

## Sincronización y comprobaciones

```sh
npm run character-set-stats:sync
npm run catalog:check
npm test
```

`catalog:sync` también incorpora ambos catálogos. La sincronización valida antes
de publicar, conserva las builds y usa el mecanismo de copias de seguridad del
proyecto. Las exportaciones generadas no son archivos de edición independiente.

Las fuentes están fijadas por `tools/character-set-source-lock.json`, con revisión
y SHA-256 por archivo. La descarga se guarda en `.cache/game-source/<revision>`.
Se usan AvatarExcelConfigData, AvatarCurveExcelConfigData,
AvatarPromoteExcelConfigData, AvatarSkillDepotExcelConfigData,
AvatarExtraLevelExcelConfigData, ReliquarySetExcelConfigData,
EquipAffixExcelConfigData y TextMap_Medium ES/EN.

Fuente: [Dimbreath / AnimeGameData2, revisión 792978e](https://gitlab.com/Dimbreath/AnimeGameData2/-/tree/792978e5503ecfba73dcb3562ed44a0d35a2abe2).
Las reglas complementarias de sets se revisaron frente a las descripciones y
`BinOutput/Ability/Temp/EquipAbilities/ConfigAbility_Relic.json`.
La única entrada excluida es el set de prueba deshabilitado 15000, sin affix de
bonos, registrado en `artifactSetsSource.excludedSets`.

Al actualizar la revisión hay que revisar las reglas de habilidades. Un nuevo
bono x1/x2 no modelado, un personaje o variante desconocidos o un set sin sus
datos hacen fallar la importación antes de publicar.
