import { builds } from './builds.js';

// convertirIdANombre es el nombre de la función
// () son los parámetros que recibe
// => indica el contenido de la función que se retorna automáticamente
// ?? es el operador de función nula, que retorna el valor de la izquierda si no es null o undefined, y encaso contrario retorna el de la derecha
export const getCharNameById = (id) => personajes[id].nombre ?? id;
export const getElementById = (id) => personajes[id].elemento ?? null;
export const getBuildById = (id) => personajes[id].builds ?? null;

const personajes = {
  10000002: { 
     nombre: 'Kamisato Ayaka',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
     ] 
  },
  10000003: { 
     nombre: 'Jean',
     elemento: 'Anemo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000005: { 
     nombre: 'Traveler Aether',
     elemento: 'Light',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000006: { 
     nombre: 'Lisa',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
        builds.carryEM.ATK,
        builds.carryEMER.ATK,
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000007: { 
     nombre: 'Traveler Lumine',
     elemento: 'Light',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000014: { 
     nombre: 'Barbara',
     elemento: 'Hydro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000015: { 
     nombre: 'Kaeya',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
     ] 
  },
  10000016: { 
     nombre: 'Diluc',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000020: { 
     nombre: 'Razor',
     elemento: 'Electro',
     builds: [
        builds.carryNoEle.ATK,
        builds.carryERNoEle.ATK,
     ] 
  },
  10000021: { 
     nombre: 'Amber',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.supp.HP,
     ] 
  },
  10000022: { 
     nombre: 'Venti',
     elemento: 'Anemo',
     builds: [
        builds.carry.EM,
        builds.supp.EM,
     ] 
  },
  10000023: { 
     nombre: 'Xiangling',
     elemento: 'Pyro',
     builds: [
        builds.carryER.ATK,
        builds.carryEMER.ATK,
     ] 
  },
  10000024: { 
     nombre: 'Beidou',
     elemento: 'Electro',
     builds: [
        builds.carryER.ATK,
        builds.carry.ATK,
     ] 
  },
  10000025: { 
     nombre: 'Xingqiu',
     elemento: 'Hydro',
     builds: [
        builds.carryER.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000026: { 
     nombre: 'Xiao',
     elemento: 'Anemo',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
     ] 
  },
  10000027: { 
     nombre: 'Ningguang',
     elemento: 'Geo',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000029: { 
     nombre: 'Klee',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000030: { 
     nombre: 'Zhongli',
     elemento: 'Geo',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
        builds.carry.HP,
     ] 
  },
  10000031: { 
     nombre: 'Fischl',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000032: { 
     nombre: 'Bennett',
     elemento: 'Pyro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
        builds.supp.ATK,
     ] 
  },
  10000033: { 
     nombre: 'Tartaglia',
     elemento: 'Hydro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000034: { 
     nombre: 'Noelle',
     elemento: 'Geo',
     builds: [
        builds.carry.DEF,
        builds.carryER.DEF,
     ] 
  },
  10000035: { 
     nombre: 'Qiqi',
     elemento: 'Cryo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000036: { 
     nombre: 'Chongyun',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
     ] 
  },
  10000037: { 
     nombre: 'Ganyu',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000038: { 
     nombre: 'Albedo',
     elemento: 'Geo',
     builds: [
        builds.carry.DEF,
        builds.supp.DEF,
     ] 
  },
  10000039: { 
     nombre: 'Diona',
     elemento: 'Cryo',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000041: { 
     nombre: 'Mona',
     elemento: 'Hydro',
     builds: [
        builds.carryER.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000042: { 
     nombre: 'Keqing',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000043: { 
     nombre: 'Sucrose',
     elemento: 'Anemo',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
        builds.carry.EM,
     ] 
  },
  10000044: { 
     nombre: 'Xinyan',
     elemento: 'Pyro',
     builds: [
        builds.carryNoEle.ATK,
        builds.carry.DEF,
     ] 
  },
  10000045: { 
     nombre: 'Rosaria',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000046: { 
     nombre: 'Hu Tao',
     elemento: 'Pyro',
     builds: [
         builds.carryEM.HP,
         builds.carry.HP,
     ] 
  },
  10000047: { 
     nombre: 'Kaedehara Kazuha',
     elemento: 'Anemo',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000048: { 
     nombre: 'Yanfei',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000049: { 
     nombre: 'Yoimiya',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000050: { 
     nombre: 'Thoma',
     elemento: 'Pyro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
        builds.carry.EM,
     ] 
  },
  10000051: { 
     nombre: 'Eula',
     elemento: 'Cryo',
     builds: [
        builds.carryNoEle.ATK,
        builds.carryERNoEle.ATK,
     ] 
  },
  10000052: { 
     nombre: 'Raiden Shogun',
     elemento: 'Electro',
     builds: [
        builds.carryER.ATK,
        builds.carryERNoEle.ATK,
        builds.carry.EM,
     ] 
  },
  10000053: { 
     nombre: 'Sayu',
     elemento: 'Anemo',
     builds: [
        builds.supp.EM,
        builds.supp.ATK,
     ] 
  },
  10000054: { 
     nombre: 'Sangonomiya Kokomi',
     elemento: 'Hydro',
     builds: [
        builds.supp.HP,
        builds.monoStat.HP,
     ] 
  },
  10000055: { 
     nombre: 'Gorou',
     elemento: 'Geo',
     builds: [
        builds.supp.DEF,
        builds.suppFav.DEF,
     ] 
  },
  10000056: { 
     nombre: 'Kujou Sara',
     elemento: 'Electro',
     builds: [
        builds.carryER.ATK,
        builds.supp.ATK,
     ] 
  },
  10000057: { 
     nombre: 'Arataki Itto',
     elemento: 'Geo',
     builds: [
        builds.carry.DEF,
        builds.carryER.DEF,
     ] 
  },
  10000058: { 
     nombre: 'Yae Miko',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000059: { 
     nombre: 'Shikanoin Heizou',
     elemento: 'Anemo',
     builds: [
        builds.carry.ATK,
        builds.carry.EM,
     ] 
  },
  10000060: { 
     nombre: 'Yelan',
     elemento: 'Hydro',
     builds: [
        builds.carry.HP,
        builds.carryER.HP,
     ] 
  },
  10000061: { 
     nombre: 'Kirara',
     elemento: 'Dendro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000062: { 
     nombre: 'Aloy',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000063: { 
     nombre: 'Shenhe',
     elemento: 'Cryo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
        builds.monoStat.ATK,
     ] 
  },
  10000064: { 
     nombre: 'Yun Jin',
     elemento: 'Geo',
     builds: [
        builds.supp.DEF,
        builds.suppFav.DEF,
     ] 
  },
  10000065: { 
     nombre: 'Kuki Shinobu',
     elemento: 'Electro',
     builds: [
         builds.monoStat.EM,
         builds.supp.EM,
         builds.supp.HP,
     ] 
  },
  10000066: { 
     nombre: 'Kamisato Ayato',
     elemento: 'Hydro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000067: { 
     nombre: 'Collei',
     elemento: 'Dendro',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000068: { 
     nombre: 'Dori',
     elemento: 'Electro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000069: { 
     nombre: 'Tighnari',
     elemento: 'Dendro',
     builds: [
        builds.carryEM.ATK,
        builds.carry.EM,
     ] 
  },
  10000070: { 
     nombre: 'Nilou',
     elemento: 'Hydro',
     builds: [
        builds.monoStat.HP,
        builds.supp.HP,
     ] 
  },
  10000071: { 
     nombre: 'Cyno',
     elemento: 'Electro',
     builds: [
        builds.carryEM.ATK,
        builds.carryEMER.ATK,
     ] 
  },
  10000072: { 
     nombre: 'Candace',
     elemento: 'Hydro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000073: { 
     nombre: 'Nahida',
     elemento: 'Dendro',
     builds: [
        builds.carry.EM,
        builds.supp.EM,
     ] 
  },
  10000074: { 
     nombre: 'Layla',
     elemento: 'Cryo',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000075: { 
     nombre: 'Wanderer',
     elemento: 'Anemo',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000076: { 
     nombre: 'Faruzan',
     elemento: 'Anemo',
     builds: [
        builds.suppFav.ATK,
        builds.supp.ATK,
     ] 
  },
  10000077: { 
     nombre: 'Yaoyao',
     elemento: 'Dendro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000078: { 
     nombre: 'Alhaitham',
     elemento: 'Dendro',
     builds: [
        builds.carry.EM,
        builds.carryEM.ATK,
     ] 
  },
  10000079: { 
     nombre: 'Dehya',
     elemento: 'Pyro',
     builds: [
        builds.carry.HP,
        builds.supp.HP,
        builds.carry.EM,
     ] 
  },
  10000080: { 
     nombre: 'Mika',
     elemento: 'Cryo',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000081: { 
     nombre: 'Kaveh',
     elemento: 'Dendro',
     builds: [
        builds.suppEM,
        builds.monoStat.EM,
     ] 
  },
  10000082: { 
     nombre: 'Baizhu',
     elemento: 'Dendro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000083: { 
     nombre: 'Lynette',
     elemento: 'Anemo',
     builds: [
        builds.supp.ATK,
     ] 
  },
  10000084: { 
     nombre: 'Lyney',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000085: { 
     nombre: 'Freminet',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000086: { 
     nombre: 'Wriothesley',
     elemento: 'Cryo',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000087: { 
     nombre: 'Neuvillette',
     elemento: 'Hydro',
     builds: [
        builds.carry.HP,
        builds.carryNoEle.HP,
     ] 
  },
  10000088: { 
     nombre: 'Charlotte',
     elemento: 'Cryo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000089: { 
     nombre: 'Furina',
     elemento: 'Hydro',
     builds: [
        builds.carryER.HP,
        builds.carryERNoEle.HP,
        builds.carry.HP,
        builds.carryNoEle.HP,
     ] 
  },
  10000090: { 
     nombre: 'Chevreuse',
     elemento: 'Pyro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000091: { 
     nombre: 'Navia',
     elemento: 'Geo',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000092: { 
     nombre: 'Gaming',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000093: { 
     nombre: 'Xianyun',
     elemento: 'Anemo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000094: { 
     nombre: 'Chiori',
     elemento: 'Geo',
     builds: [
        builds.carry.DEF,
     ] 
  },
  10000095: { 
     nombre: 'Sigewinne',
     elemento: 'Hydro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000096: { 
     nombre: 'Arlecchino',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000097: { 
     nombre: 'Sethos',
     elemento: 'Electro',
     builds: [
        builds.carry.EM,
        builds.carryEM.ATK,
     ] 
  },
  10000098: { 
     nombre: 'Clorinde',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000099: { 
     nombre: 'Emilie',
     elemento: 'Dendro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000100: { 
     nombre: 'Kachina',
     elemento: 'Geo',
     builds: [
        builds.supp.DEF,
        builds.suppFav.DEF,
     ] 
  },
  10000101: { 
     nombre: 'Kinich',
     elemento: 'Dendro',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000102: { 
     nombre: 'Mualani',
     elemento: 'Hydro',
     builds: [
        builds.carry.HP,
        builds.carryEM.HP,
     ] 
  },
  10000103: { 
     nombre: 'Xilonen',
     elemento: 'Geo',
     builds: [
        builds.supp.DEF,
        builds.suppFav.DEF,
     ] 
  },
  10000104: { 
     nombre: 'Chasca',
     elemento: 'Anemo',
     builds: [
        builds.carryNoEle.ATK,
     ] 
  },
  10000105: { 
     nombre: 'Ororon',
     elemento: 'Electro',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000106: { 
     nombre: 'Mavuika',
     elemento: 'Pyro',
     builds: [
        builds.carryEM.ATK,
        builds.carry.ATK,
     ] 
  },
  10000107: { 
     nombre: 'Citlali',
     elemento: 'Cryo',
     builds: [
        builds.supp.EM,
     ] 
  },
  10000108: { 
     nombre: 'Lan Yan',
     elemento: 'Anemo',
     builds: [
        builds.supp.ATK,
        builds.supp.EM,
        builds.suppEM.ATK,
     ] 
  },
  10000109: { 
     nombre: 'Yumemizuki Mizuki',
     elemento: 'Anemo',
     builds: [
        builds.monoStat.EM,
        builds.supp.EM,
     ] 
  },
  10000110: { 
     nombre: 'Iansan',
     elemento: 'Electro',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000111: { 
     nombre: 'Varesa',
     elemento: 'Electro',
     builds: [
        builds.carry.ATK,
        builds.carryER.ATK,
     ] 
  },
  10000112: { 
     nombre: 'Escoffier',
     elemento: 'Cryo',
     builds: [
        builds.carryER.ATK,
        builds.carryERNoEle.ATK,
     ] 
  },
  10000113: { 
     nombre: 'Ifa',
     elemento: 'Anemo',
     builds: [
        builds.supp.EM,
     ] 
  },
  10000114: { 
     nombre: 'Skirk',
     elemento: 'Cryo-abyss',
     builds: [
        builds.carry.ATK,
     ] 
  },
  10000115: { 
     nombre: 'Dahlia',
     elemento: 'Hydro',
     builds: [
        builds.supp.HP,
        builds.suppFav.HP,
     ] 
  },
  10000116: { 
     nombre: 'Ineffa',
     elemento: 'Electro',
     builds: [
        builds.carryNoEle.ATK,
        builds.carryEMNoEle.ATK,
        builds.carryEMERNoEle.ATK,
     ] 
  },
  10000117: { 
     nombre: 'Manekin',
     elemento: null,
     builds: [] 
  },
  10000118: { 
     nombre: 'Manekina',
     elemento: null,
     builds: [] 
  },
  10000119: { 
     nombre: 'Lauma',
     elemento: 'Dendro',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000120: { 
     nombre: 'Flins',
     elemento: 'Electro',
     builds: [
        builds.carryEMNoEle.ATK,
     ] 
  },
  10000121: { 
     nombre: 'Aino',
     elemento: 'Hydro',
     builds: [
        builds.supp.EM,
        builds.suppFav.EM,
     ] 
  },
  10000122: { 
     nombre: 'Nefer',
     elemento: 'Dendro',
     builds: [
        builds.carryNoEle.EM,
     ] 
  },
  10000123: { 
     nombre: 'Durin',
     elemento: 'Pyro',
     builds: [
        builds.carry.ATK,
        builds.carryEM.ATK,
     ] 
  },
  10000124: { 
     nombre: 'Jahoda',
     elemento: 'Anemo',
     builds: [
        builds.supp.ATK,
        builds.suppFav.ATK,
     ] 
  },
  10000125: { 
     nombre: 'Columbina',
     elemento: 'Hydro',
     builds: [
        builds.carryEMERNoEle.HP,
        builds.carryERNoEle.HP,
     ] 
  },
  10000126: { 
     nombre: 'Zibai',
     elemento: 'Geo',
     builds: [
        builds.carryNoEle.DEF,
     ] 
  },
  10000127: { 
     nombre: 'Illuga',
     elemento: 'Geo',
     builds: [
        builds.supp.DEF,
        builds.suppFav.DEF,
     ] 
  },
  10000128: { 
     nombre: 'Varka',
     elemento: 'Anemo',
     builds: [
        builds.carryNoEle.ATK,
     ] 
  }
};