# Catálogo de estadísticas de armas

Los datos están en `catalog.json → generated` y en su exportación
`generated/game.json`. Se conservan los nombres e iconos existentes.

## Organización

| Campo | Contenido |
| --- | --- |
| `weapons[id].rarity`, `weaponType` | Rareza y clase del arma |
| `maxLevel`, `maxRefinement` | Límites reales; las armas de 1–2 estrellas llegan a 70 y algunas armas solo admiten R1 |
| `progression.baseStats` | Propiedad, valor inicial y curva de crecimiento |
| `progression.ascensions[0..6]` | Niveles mínimo/máximo y bonos acumulados de ascensión |
| `weaponCurves[curve][level]` | Multiplicador de cada nivel, sin interpolación |
| `passives[].refinements[1..5]` | Texto completo ES/EN, parámetros originales y efectos por refinamiento |
| `effects` | Bonos permanentes directos, conversiones y algunas conversiones periódicas identificadas explícitamente |
| `weaponStatsSource` | Repositorio, versión, revisión fijada, fecha de revisión y SHA-256 de cada archivo fuente |

La revisión inicial cubre las **255 entradas** que ya estaban en Enka. Tres son
marcadores de la fuente (`12505`, `15504`, `15505`), identificados mediante
`availability: "source-placeholder"`; no representan armas obtenibles verificadas.
No se agregan automáticamente las demás entradas internas del juego.

## Unidades y niveles

Se usan nombres `FIGHT_PROP_*` compatibles con los conceptos de Enka. Los
porcentajes son **fracciones**: `0.20` significa 20 %, y `100` de Maestría significa
100 puntos. Los valores no se redondean al calcular; solo deberían redondearse
para mostrarlos. El ATQ que muestra Enka en `flat.weaponStats` puede estar redondeado.

Para cada propiedad:

```text
valor(nivel, ascensión) = valorInicial × curva[nivel] + bonoAcumulado[ascensión]
```

Las curvas se comparten para evitar repetir miles de valores. Esto representa
todos los niveles válidos, no solo los máximos. `weaponStatsAtLevel` materializa
el mapa de estadísticas de cualquier combinación legal:

```js
import { weaponStatsAtLevel, weaponContributions } from '../script/domain/weapon-stats.js';

const { weapons, weaponCurves } = catalog.generated;
const stats = weaponStatsAtLevel(weapons['15501'], weaponCurves, 20, 1);
// Alas Celestiales, nivel 20 ya ascendida: ATQ 164.393748, CR 0.084816.
// Nivel 20 sin ascender (ascensión 0): ATQ 133.293748, mismo CR.

const breakdown = weaponContributions(weapons['15501'], weaponCurves, {
  level: 90, ascension: 6, refinement: 1,
});
// equipment: ATQ base 674.334546, CR 0.220512
// permanent: CD 0.20
```

Se rechazan niveles fuera del límite de su ascensión. No se deduce la ascensión
solo por el nivel, porque 20/20 y 20/40 son estados distintos.

## Pasivas y atribución

Los bonos de `EquipAffixExcelConfigData.addProps` se importan directamente para
cada refinamiento. Reglas adicionales revisadas cubren los bonos elementales
permanentes y las conversiones que el juego implementa mediante habilidades.
Hay **47 armas con aportes permanentes modelados** a estadísticas generales en
esta revisión. Las demás pueden tener efectos condicionales o bonos de daño
limitados a ciertos ataques, que se conservan en las descripciones completas.

| Ejemplo | R1 | R5 |
| --- | --- | --- |
| Alas Celestiales | 20 % de daño crítico | 40 % |
| Relicario de la Verdad | 8 % de probabilidad crítica | 16 % |
| Aqua Simulacra | 16 % de Vida | 32 % |

`weaponContributions` devuelve:

- `equipment`: ATQ base y atributo secundario según nivel/ascensión.
- `permanent`: incrementos constantes de las pasivas.
- `derived`: conversiones permanentes resueltas con los datos necesarios.
- `total`: suma por propiedad de esos tres grupos, **no** estadísticas finales del personaje.
- `effects`: efectos aplicados con su procedencia.
- `pending` e `issues`: reglas que requieren contexto o entradas que faltan.

El ATQ base del arma (`FIGHT_PROP_BASE_ATTACK`) forma parte del ATQ base del
personaje. `FIGHT_PROP_ATTACK_PERCENT` se aplica a ese ATQ base combinado;
`FIGHT_PROP_ATTACK` representa ATQ adicional. Vida % y DEF % se aplican a sus
respectivos valores base del personaje. Este catálogo todavía no reconstruye
esas bases ni las contribuciones de personajes, artefactos o compañeros.

Las conversiones de Jade y Homa usan `stats.FIGHT_PROP_MAX_HP`, la Vida máxima
final observada, que **ya incluye** el bono de Vida del arma. No se vuelve a
aplicar ese porcentaje. La bonificación adicional de Homa con poca Vida no se
considera permanente.

Luz del Segador usa `FIGHT_PROP_NONEXTRA_CHARGE_EFFICIENCY` y
`FIGHT_PROP_BASE_ATTACK`; Báculo de las Arenas Escarlatas usa
`FIGHT_PROP_NONEXTRA_ELEMENT_MASTERY`. Las habilidades del juego excluyen de esas
entradas determinados bonos derivados. No se sustituyen por Recarga/Maestría
totales del escaneo: el futuro desglose deberá aportar los valores elegibles.
Sin esos datos, la conversión queda pendiente, no se inventa un cero.

Las conversiones periódicas de Luz Lunar de Xifos, Aguamarina de Mahaira y Estrella
Errabunda se guardan con factor, duración, intervalo y proporción compartida,
pero no se aplican automáticamente. Tampoco se presuponen acumulaciones,
enemigos, composición de equipo, plataforma, misiones completadas, escudos,
estado de combate ni buffs de compañeros. El texto de cada refinamiento conserva
esos efectos para una futura ampliación; no todos tienen reglas ejecutables.

Los bonos de probabilidad crítica exclusivos de la Habilidad o Definitiva
(por ejemplo, La Captura) no se suman a la probabilidad crítica global.

## Integración con el escaneo

`characterWeapon` devuelve `id`, `ascension` y `contributions` junto a nombre,
nivel, refinamiento e icono. Convierte el refinamiento de Enka (0–4) a R1–R5;
un refinamiento ausente no se convierte silenciosamente en R1. La ascensión
omitida por protobuf se interpreta como 0.

Se conservan intactos los totales recibidos desde Enka. Esta etapa prepara los
datos del desglose; todavía no agrega una pantalla de desglose completo.

## Reproducibilidad y actualización

```sh
npm run weapon-stats:sync
npm run catalog:check
npm test
```

La sincronización descarga únicamente archivos fijados por
`tools/weapon-source-lock.json`, verifica sus SHA-256, valida el candidato y usa
el mecanismo existente de publicación con copia de seguridad. La caché local
`.cache/weapon-source/<revision>` no se versiona. `catalog:sync` también incorpora
los datos de estadísticas; las actualizaciones de iconos preservan esta información.

Para actualizar de versión, revisar una nueva revisión de la fuente, actualizar
el bloqueo y revisar `tools/weapon-passive-rules.mjs` frente a las nuevas
descripciones/habilidades. Si aparece un ID de Enka ausente de la fuente fijada,
la importación falla antes de publicar. Un nuevo formato de valores también
provoca un error en lugar de producir estadísticas silenciosamente incorrectas.

Fuente: [Dimbreath / AnimeGameData2, revisión fijada](https://gitlab.com/Dimbreath/AnimeGameData2/-/tree/792978e5503ecfba73dcb3562ed44a0d35a2abe2).
Se utilizan WeaponExcelConfigData, WeaponCurveExcelConfigData,
WeaponPromoteExcelConfigData, EquipAffixExcelConfigData y TextMap_Medium ES/EN.
Las reglas complementarias se revisaron también contra los archivos
`BinOutput/Ability/Temp/EquipAbilities/ConfigAbility_Weapon_*.json` de esa revisión.
