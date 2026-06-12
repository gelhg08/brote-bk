/**
 * Seed de Brote — catálogo REAL extraído de docs/catalogo.md (BE Medellín).
 *
 * Convenciones:
 * - `priceBeforeTax` en CENTAVOS de COP, SIN IVA (ej. $21.000 → 2_100_000). El IVA (19%) se aplica
 *   al calcular el total de la orden, no aquí.
 * - Cada código del catálogo (B435, S266, T917, A372, ...) es un SKU = una variante del producto.
 * - `color` solo se rellena cuando el catálogo lo nombra (cepillos/peines). Si no, queda null.
 * - Idempotente: upsert por slug (producto) y por sku (variante). El stock se fija solo al crear.
 *
 * Nota: extracción best-effort de un PDF OCR-eado; algunos precios/agrupaciones pueden requerir
 * ajuste contra la fuente. Revisar docs/catalogo.md ante dudas.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_STOCK = 50;

const categories = [
  { slug: 'mugs', name: 'Mugs' },
  { slug: 'vasos-plegables', name: 'Vasos plegables' },
  { slug: 'termos', name: 'Termos' },
  { slug: 'loncheras-y-porta-comidas', name: 'Loncheras y porta-comidas' },
  { slug: 'vajilla-y-mesa', name: 'Vajilla y mesa' },
  { slug: 'cubiertos-y-pitillos', name: 'Cubiertos y pitillos' },
  { slug: 'hogar-y-cocina', name: 'Hogar y cocina' },
  { slug: 'cuidado-personal-y-bano', name: 'Cuidado personal y baño' },
  { slug: 'bebe', name: 'Bebé' },
  { slug: 'bolsas', name: 'Bolsas' },
];

type Variant = { sku: string; color?: string };
type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  priceBeforeTax: number; // centavos COP sin IVA
  material?: string;
  shortDescription?: string;
  variants: Variant[];
};

/** Helper: lista de SKUs sin color → variantes. */
const v = (...skus: string[]): Variant[] => skus.map((sku) => ({ sku }));

const products: SeedProduct[] = [
  // ─── MUGS ──────────────────────────────────────────────────────────────────
  { slug: 'mug-450', name: 'Mug 450', category: 'mugs', priceBeforeTax: 2_700_000, material: 'Silicona',
    shortDescription: '450 ml / 15 oz · 10×9.3×13.8 cm · plegable a 6 cm · pitillo y protector de calor', variants: v('S266', 'S613') },
  { slug: 'mug-600', name: 'Mug 600', category: 'mugs', priceBeforeTax: 3_300_000, material: 'Silicona',
    shortDescription: '600 ml · 9.6×9.6×17 cm · plegado 6.8 cm · pitillo y protector de calor', variants: v('S303', 'S707', 'S706', 'S708') },
  { slug: 'mug-clasico', name: 'Mug Clásico', category: 'mugs', priceBeforeTax: 2_100_000, material: 'Cerámica con caja de cartón',
    shortDescription: '14 oz / 400 ml · 8.2×13 cm · tapa de silicona · protector de calor',
    variants: v('B435', 'B446', 'B450', 'B448', 'B453', 'B451', 'B433', 'B432', 'B454', 'B452', 'B445', 'B428', 'B439', 'B440', 'B447', 'B442', 'B457', 'B443') },
  { slug: 'mug-350', name: 'Mug 350', category: 'mugs', priceBeforeTax: 2_200_000, material: 'Fibra de bambú',
    shortDescription: '350 ml / 12 oz · 9.5×11 cm · tapa y mug · caja de cartón', variants: v('B565', 'B566', 'B568', 'B562', 'B567') },
  { slug: 'mug-green', name: 'Mug Green', category: 'mugs', priceBeforeTax: 2_300_000, material: 'Cerámica',
    shortDescription: '14 oz / 400 ml · 8.2×13 cm · caja de cartón · tapa de silicona',
    variants: v('B469', 'B464', 'B460', 'B475', 'B462', 'B468', 'B459', 'B471', 'B474', 'B466', 'B484', 'B465', 'B472') },
  { slug: 'mug-solido', name: 'Mug Sólido', category: 'mugs', priceBeforeTax: 2_300_000, material: 'Cerámica',
    shortDescription: '500 ml / 16 oz · 7.8×15 cm', variants: v('B482', 'B483', 'B479', 'B104', 'B776', 'B477', 'B774', 'B775', 'B480', 'B478') },
  { slug: 'mug-milu', name: 'Mug Milu', category: 'mugs', priceBeforeTax: 2_200_000, material: 'Fibra de café',
    shortDescription: '350 ml · tapa de fibra de café · tapa anti-derrames · caja de cartón', variants: v('C947', 'C948') },
  { slug: 'mug-maca', name: 'Mug Maca', category: 'mugs', priceBeforeTax: 2_000_000, material: 'Fibra de café',
    shortDescription: '400 ml · 8×6 cm · protector y tapa de silicona · caja de cartón', variants: v('C486', 'C385', 'C488', 'C487') },
  { slug: 'mug-eco-white', name: 'Mug Eco-White', category: 'mugs', priceBeforeTax: 2_600_000, material: 'Cerámica',
    shortDescription: '450 ml / 16 oz · 10.5×15 cm', variants: v('B868', 'B869', 'B866') },
  { slug: 'mug-coffe', name: 'Mug Coffe', category: 'mugs', priceBeforeTax: 1_800_000, material: 'Cerámica',
    shortDescription: '400 ml', variants: v('B118', 'B594', 'B589', 'B595') },
  { slug: 'mug-chic-mic', name: 'Mug Chic-Mic', category: 'mugs', priceBeforeTax: 2_800_000, material: 'Cerámica con tapa de fibra de bambú',
    shortDescription: '13.5 oz / 400 ml · 8.7×12.2 cm · protector de calor · caja', variants: v('B130') },
  { slug: 'mug-ecoffe', name: 'Mug Ecoffe', category: 'mugs', priceBeforeTax: 2_100_000, material: 'Cerámica con tapa de silicona',
    shortDescription: '350 ml · protector de calor · caja', variants: v('B573', 'B128', 'B597') },
  { slug: 'mug-nomaad-591', name: 'Mug Nomaad 591', category: 'mugs', priceBeforeTax: 3_300_000, material: 'Acero inoxidable',
    shortDescription: '591 ml / 20 oz · 8.5×15.5 cm', variants: v('B580') },
  { slug: 'mug-dog', name: 'Mug Dog', category: 'mugs', priceBeforeTax: 2_100_000, material: 'Cerámica',
    shortDescription: '350 ml / 12 oz · 8.5×11 cm', variants: [{ sku: 'B581' }, { sku: 'B933', color: 'Cangrejos' }, { sku: 'B393', color: 'Perritos' }] },
  { slug: 'mug-origen', name: 'Mug Origen', category: 'mugs', priceBeforeTax: 1_100_000, material: 'Fibra de trigo',
    shortDescription: '350 ml · 8.5×13.5 cm · con mezclador', variants: v('T1040', 'T1041') },
  { slug: 'mug-maky', name: 'Mug Maky', category: 'mugs', priceBeforeTax: 5_500_000, material: 'Acero inoxidable',
    shortDescription: '600 ml / 20 oz · 18.6×10 cm · banda de silicona · pitillo de acero · calor 7-10 h / frío 12-24 h', variants: v('A840', 'A838', 'A843') },
  { slug: 'mug-maky-lite', name: 'Mug Maky Lite', category: 'mugs', priceBeforeTax: 3_300_000, material: 'Acero inoxidable',
    shortDescription: '600 ml / 20 oz · 18.6×10 cm · calor 4-6 h / frío 9-12 h · pitillo de acero', variants: v('A935') },
  { slug: 'mug-hoti', name: 'Mug Hoti', category: 'mugs', priceBeforeTax: 2_900_000, material: 'Acero inoxidable',
    shortDescription: '500 ml · 7×16.5 cm · termómetro LED · frío 10 h / calor 5 h', variants: v('A928') },
  { slug: 'mug-coctel', name: 'Mug Taza Coctel', category: 'mugs', priceBeforeTax: 2_200_000, material: 'Acero inoxidable',
    shortDescription: '12 oz / 300 ml · forma de huevo · doble pared · 11×8 cm', variants: v('A618') },
  { slug: 'mug-flamenco', name: 'Mug Flamenco', category: 'mugs', priceBeforeTax: 3_500_000, material: 'Interior acero inoxidable / exterior fibra de bambú',
    shortDescription: '450 ml / 16 oz · 8×15 cm · caliente 2 h / frío 4 h', variants: v('B277') },
  { slug: 'mug-shine', name: 'Mug Shine', category: 'mugs', priceBeforeTax: 3_450_000, material: 'Interior acero inoxidable / exterior escarchado',
    shortDescription: '600 ml / 20 oz · 21×7 cm · calor 4-6 h / frío 6-10 h', variants: v('A550', 'A551') },
  { slug: 'cup-shot', name: 'Cup Shot', category: 'mugs', priceBeforeTax: 1_600_000, material: 'Bambú natural',
    shortDescription: '150 ml / 5 oz · 9×6.5 cm · tapa y pitillo de silicona', variants: v('B379') },

  // ─── VASOS PLEGABLES ─────────────────────────────────────────────────────────
  { slug: 'vaso-plegable-fold', name: 'Vaso Plegable Fold', category: 'vasos-plegables', priceBeforeTax: 1_000_000, material: 'Silicona',
    shortDescription: '200 ml / 10 oz · 10.5×8 cm · tapa transparente con tira', variants: v('S879', 'S880', 'S881', 'S878') },
  { slug: 'vaso-plegable-oso', name: 'Vaso Plegable Oso', category: 'vasos-plegables', priceBeforeTax: 1_500_000, material: 'Silicona',
    shortDescription: '320 ml / 10 oz · 9.5×10 cm · tapa transparente con tira', variants: v('S701', 'S703', 'S702') },
  { slug: 'vaso-plegable-copa', name: 'Vaso Plegable para Copa', category: 'vasos-plegables', priceBeforeTax: 1_200_000, material: 'Silicona',
    shortDescription: '300 ml · 7.2×7 cm', variants: v('S704', 'S214', 'S705') },

  // ─── TERMOS ──────────────────────────────────────────────────────────────────
  { slug: 'termo-420', name: 'Termo 420', category: 'termos', priceBeforeTax: 1_900_000, material: 'Fibra de trigo',
    shortDescription: '420 ml / 14 oz · 8.2×16.3 cm', variants: v('T679') },
  { slug: 'termo-urban', name: 'Termo Urban', category: 'termos', priceBeforeTax: 1_200_000, material: 'Silicona con gancho',
    shortDescription: '600 ml · 23×7.5 cm · plegado 12×7.5 cm', variants: v('S1094', 'S1091', 'S1090') },
  { slug: 'termo-easy-go-600', name: 'Termo Easy Go 600', category: 'termos', priceBeforeTax: 900_000, material: 'Silicona',
    shortDescription: '600 ml · 131 g · 21.5×7 cm · plegado 6.5×11 cm', variants: v('S1093', 'S1092', 'S1077') },
  { slug: 'termo-330', name: 'Termo 330', category: 'termos', priceBeforeTax: 1_400_000,
    shortDescription: '330 ml · 7×12.5 cm · incluye cuchara', variants: v('T343', 'T782', 'T783', 'T784') },
  { slug: 'termo-trigo-tira-250', name: 'Termo Trigo Tira 250', category: 'termos', priceBeforeTax: 1_350_000, material: 'Fibra de trigo',
    shortDescription: '250 ml / 8.4 oz · 7×17 cm', variants: v('T336', 'T690', 'T688', 'T689') },
  { slug: 'termo-yimi', name: 'Termo Yimi', category: 'termos', priceBeforeTax: 2_300_000, material: 'Acero inoxidable',
    shortDescription: '360 ml / 12 oz · 17×6 cm · calor 5 h / frío 9 h', variants: v('A1002', 'A1003', 'A1004') },
  { slug: 'termo-rio', name: 'Termo Rio', category: 'termos', priceBeforeTax: 4_200_000, material: 'Acero inoxidable',
    shortDescription: '750 ml / 25 oz · 21.8×8 cm · tapa flip · calor 12 h / frío 24 h', variants: v('A994', 'A992', 'A993') },
  { slug: 'termo-digital', name: 'Termo Digital', category: 'termos', priceBeforeTax: 1_850_000, material: 'Acero inoxidable',
    shortDescription: '500 ml / 17 oz · 6.5×23.5 cm · pantalla LED de temperatura', variants: v('A601', 'A376', 'A599') },
  { slug: 'termo-neo', name: 'Termo Neo', category: 'termos', priceBeforeTax: 5_500_000, material: 'Acero inoxidable',
    shortDescription: '750 ml / 25 oz · 7×21 cm · 2 formas de tomar · calor 6-10 h / frío 12-24 h', variants: v('A926') },
  { slug: 'termo-petit', name: 'Termo Petit', category: 'termos', priceBeforeTax: 1_700_000, material: 'Acero inoxidable',
    shortDescription: '200 ml / 7 oz · 13.5×4.5 cm · calor 4 h / frío 9 h', variants: v('A1006', 'A1008', 'A1007') },
  { slug: 'termo-bego', name: 'Termo beGo', category: 'termos', priceBeforeTax: 2_700_000, material: 'Acero inoxidable siliconado',
    shortDescription: '550 ml', variants: v('A924', 'A923') },
  { slug: 'termo-aura', name: 'Termo Aura', category: 'termos', priceBeforeTax: 3_900_000, material: 'Acero inoxidable',
    shortDescription: '500 ml / 18 oz · 6.8×22 cm · 230 g · calor 6-9 h / frío 12-24 h', variants: v('A942', 'A944') },
  { slug: 'termo-just', name: 'Termo Just', category: 'termos', priceBeforeTax: 3_700_000, material: 'Acero inoxidable',
    shortDescription: '600 ml · 7.6×10.1×23.7 cm · calor 6-10 h / frío 12-24 h', variants: v('T968') },
  { slug: 'termo-bambu', name: 'Termo Bambú', category: 'termos', priceBeforeTax: 3_700_000, material: 'Acero inoxidable',
    shortDescription: '500 ml / 16 oz · 7×24 cm · calor 6 h / frío 12 h', variants: v('A324') },
  { slug: 'termo-fluorescente', name: 'Termo Fluorescente', category: 'termos', priceBeforeTax: 3_600_000, material: 'Acero inoxidable',
    shortDescription: '500 ml · conserva temperatura', variants: v('A951') },
  { slug: 'termo-boreal-610', name: 'Termo Acero Boreal 610', category: 'termos', priceBeforeTax: 4_200_000, material: 'Acero inoxidable',
    shortDescription: '610 ml / 18 oz · frío 12 h / calor 6 h', variants: v('A372') },
  { slug: 'termo-boreal-650', name: 'Termo Acero Boreal 650', category: 'termos', priceBeforeTax: 4_700_000, material: 'Acero inoxidable',
    shortDescription: '650 ml / 22 oz · frío 12 h / calor 6 h', variants: v('A763') },
  { slug: 'termo-ecoterm', name: 'Termo Ecoterm', category: 'termos', priceBeforeTax: 4_500_000, material: 'Acero inoxidable',
    shortDescription: '750 ml / 25 oz · 7.6×26 cm · calor 6-9 h / frío 12-24 h', variants: v('A826', 'A825', 'A824', 'A941') },
  { slug: 'termo-xiao', name: 'Termo Xiao', category: 'termos', priceBeforeTax: 4_500_000, material: 'Acero 304',
    shortDescription: '900 ml / 30 oz · 24×9 cm · pitillo de acero · antiderrame · frío 12 h / calor 6 h', variants: v('A863', 'A860', 'A864', 'A861') },
  { slug: 'termo-sidney', name: 'Termo Sidney', category: 'termos', priceBeforeTax: 7_000_000, material: 'Acero inoxidable',
    shortDescription: '900 ml / 30 oz · 24.2×13.9 cm · pitillo + retráctil · calor 6-10 h / frío 12-24 h', variants: v('A847', 'A848', 'A844', 'A846') },
  { slug: 'termo-wonder', name: 'Termo Wonder', category: 'termos', priceBeforeTax: 7_500_000, material: 'Acero inoxidable',
    shortDescription: '1200 ml / 40 oz · 9×27 cm · 2 formas de tomar · calor 6-9 h / frío 12-24 h', variants: v('A837', 'A836', 'A821', 'A822', 'A823') },
  { slug: 'termo-hipp', name: 'Termo Hipp', category: 'termos', priceBeforeTax: 7_000_000, material: 'Acero inoxidable',
    shortDescription: '1200 ml · siliconado · trípode para celular · calor 6 h / frío 15 h · antiderrame', variants: v('A781', 'A777', 'A778', 'A779', 'A371', 'A780') },
  { slug: 'termo-espacial', name: 'Termo Espacial', category: 'termos', priceBeforeTax: 6_500_000, material: 'Acero inoxidable',
    shortDescription: '850 ml / 28 oz · 20.7×11 cm · pitillo removible · stickers y pines · calor 6 h / frío 12 h', variants: v('A557', 'A558', 'A328') },
  { slug: 'termo-take-away', name: 'Termo Take Away', category: 'termos', priceBeforeTax: 6_000_000, material: 'Acero inoxidable',
    shortDescription: '850 ml / 28 oz · 21×10 cm · pitillo removible · calor 6 h / frío 12 h', variants: v('A561', 'A602', 'A560', 'A327', 'A559') },
  { slug: 'travel-max-2', name: 'Travel Max 2.0', category: 'termos', priceBeforeTax: 7_000_000, material: 'Acero inoxidable',
    shortDescription: '2000 ml / 68 oz · 28.5×9.8 cm · incluye correa', variants: v('A1000') },

  // ─── LONCHERAS Y PORTA-COMIDAS ───────────────────────────────────────────────
  { slug: 'lonchera-mega-2', name: 'Lonchera Mega 2.0', category: 'loncheras-y-porta-comidas', priceBeforeTax: 8_500_000, material: 'Acero inoxidable',
    shortDescription: '2000 ml / 68 oz · 3 niveles · 22×15 cm · calor 12 h', variants: v('A1081', 'A1085') },
  { slug: 'porta-gocup', name: 'Porta-GoCup', category: 'loncheras-y-porta-comidas', priceBeforeTax: 3_200_000, material: 'Acero doble pared',
    shortDescription: '280 ml / 12 oz · 11×7.2 cm · 133 g · calor 6-10 h / frío 10-15 h', variants: v('A819', 'A817', 'A818', 'A816') },
  { slug: 'portacomida-eimai-680', name: 'Portacomida Eimai 680', category: 'loncheras-y-porta-comidas', priceBeforeTax: 4_000_000, material: 'Acero inoxidable',
    shortDescription: '680 ml · 16×9.5 cm · calor 5 h / frío 7 h', variants: v('T1031') },
  { slug: 'portacomida-msnh-800', name: 'Portacomida MSNH 800', category: 'loncheras-y-porta-comidas', priceBeforeTax: 4_600_000, material: 'Acero inoxidable',
    shortDescription: '800 ml · 14×12 cm · calor 6-10 h', variants: v('T1086', 'T1083') },
  { slug: 'portacomida-euro-11', name: 'Portacomida Euro 1.1L', category: 'loncheras-y-porta-comidas', priceBeforeTax: 5_400_000, material: 'Acero inoxidable 304',
    shortDescription: '1100 ml · 12×15.5 cm · +1 compartimiento interno · calor 6 h', variants: v('T1084', 'T1080') },
  { slug: 'portacomida-food-1450', name: 'Portacomida Food 1.450', category: 'loncheras-y-porta-comidas', priceBeforeTax: 9_500_000, material: 'Acero inoxidable',
    shortDescription: '1450 ml · calor 10 h / frío 14 h', variants: v('T1029', 'T1030') },
  { slug: 'portacomida-pot-15', name: 'Portacomida Pot 1.5L', category: 'loncheras-y-porta-comidas', priceBeforeTax: 7_600_000, material: 'Acero inoxidable',
    shortDescription: '1500 ml · 20×13 cm · 2 compartimientos · calor 12 h', variants: v('T1059', 'T1057', 'T1058') },
  { slug: 'food-jar-1200', name: 'Termo Food Jar 1.200', category: 'loncheras-y-porta-comidas', priceBeforeTax: 5_400_000, material: 'Acero inoxidable',
    shortDescription: '1200 ml · calor y frío', variants: v('A956') },
  { slug: 'food-jar-1500', name: 'Termo Food Jar 1.500', category: 'loncheras-y-porta-comidas', priceBeforeTax: 6_600_000, material: 'Acero inoxidable',
    shortDescription: '1500 ml · 2 formas de tomar · calor y frío', variants: v('A957') },
  { slug: 'lonchera-flexy-s', name: 'Lonchera Flexy S', category: 'loncheras-y-porta-comidas', priceBeforeTax: 800_000, material: 'Silicona plegable',
    shortDescription: '350 ml · 9.5×13×6 cm · -40 a 240 °C · apto microondas/horno/congelador', variants: [{ sku: 'S1068', color: 'Menta' }, { sku: 'S1087', color: 'Rosa' }] },
  { slug: 'lonchera-flexy-m', name: 'Lonchera Flexy M', category: 'loncheras-y-porta-comidas', priceBeforeTax: 1_000_000, material: 'Silicona plegable',
    shortDescription: '500 ml · 10.7×16.3×6.8 cm', variants: [{ sku: 'S1069', color: 'Menta' }, { sku: 'S1088', color: 'Rosa' }] },
  { slug: 'lonchera-flexy-l', name: 'Lonchera Flexy L', category: 'loncheras-y-porta-comidas', priceBeforeTax: 1_200_000, material: 'Silicona plegable',
    shortDescription: '800 ml · 12×18.3×6.8 cm', variants: [{ sku: 'S1089', color: 'Menta' }, { sku: 'S1070', color: 'Rosa' }] },
  { slug: 'lonchera-flexy-xl', name: 'Lonchera Flexy XL', category: 'loncheras-y-porta-comidas', priceBeforeTax: 1_600_000, material: 'Silicona plegable',
    shortDescription: '1200 ml · 14×21.5×7.5 cm', variants: [{ sku: 'S1071', color: 'Lila' }] },
  { slug: 'lonchera-redonda', name: 'Lonchera Redonda', category: 'loncheras-y-porta-comidas', priceBeforeTax: 3_000_000,
    shortDescription: 'Con cubiertos · doble compartimiento · Ø16×11 cm · 1500 ml', variants: v('T730', 'T733', 'T731') },
  { slug: 'lonchera-1500', name: 'Lonchera 1500', category: 'loncheras-y-porta-comidas', priceBeforeTax: 3_300_000, material: 'Fibra de trigo',
    shortDescription: '1500 ml · 21×15×9 cm · +compartimiento de cubiertos', variants: v('T805', 'T806') },
  { slug: 'lonchera-doble', name: 'Lonchera Doble', category: 'loncheras-y-porta-comidas', priceBeforeTax: 2_900_000, material: 'Fibra de trigo',
    shortDescription: '2 compartimientos · incluye cubiertos', variants: v('T386', 'T804') },
  { slug: 'lonchera-1000', name: 'Lonchera 1000', category: 'loncheras-y-porta-comidas', priceBeforeTax: 2_400_000, material: 'Fibra de trigo',
    shortDescription: '1000 ml · 21×14.5×4 cm · +compartimiento de cubiertos', variants: v('T345', 'T803', 'T801', 'T1051') },
  { slug: 'lonchi-bag', name: 'Lonchi Bag', category: 'loncheras-y-porta-comidas', priceBeforeTax: 5_500_000,
    shortDescription: 'Lonchera + 2 portacomidas (1200 ml y 600 ml) + cubiertos', variants: v('T940') },
  { slug: 'lonchera-tria', name: 'Lonchera Tria', category: 'loncheras-y-porta-comidas', priceBeforeTax: 1_700_000, material: 'Fibra de trigo',
    shortDescription: '900 ml · 18.5×10.5×8 cm · 3 compartimientos · con cuchara y tenedor', variants: v('T972', 'T970', 'T969') },
  { slug: 'lonchera-darly', name: 'Lonchera Darly', category: 'loncheras-y-porta-comidas', priceBeforeTax: 3_300_000, material: 'Fibra de trigo',
    shortDescription: '1200 ml · 24.5×7 cm · caja de cartón', variants: v('T1048', 'T1049') },

  // ─── VAJILLA Y MESA ──────────────────────────────────────────────────────────
  { slug: 'set-vajilla-unicornio', name: 'Set Vajilla Grande Unicornio', category: 'vajilla-y-mesa', priceBeforeTax: 6_000_000, material: 'Bambú',
    shortDescription: 'Plato + sopa + bottle + empaque de cartón', variants: v('B338') },
  { slug: 'set-vajilla-completo', name: 'Set Vajilla (Plato+Sopa+Taza+Cubiertos)', category: 'vajilla-y-mesa', priceBeforeTax: 4_500_000, material: 'Bambú',
    shortDescription: 'Plato + sopa + taza + cubiertos · caja de cartón', variants: v('B239', 'B241', 'B278') },
  { slug: 'set-vajilla-basico', name: 'Set Vajilla (Plato+Sopa+Taza)', category: 'vajilla-y-mesa', priceBeforeTax: 3_500_000, material: 'Bambú',
    shortDescription: 'Plato + sopa + taza · caja de cartón', variants: v('B396', 'B341', 'B340') },
  { slug: 'bandeja', name: 'Bandeja', category: 'vajilla-y-mesa', priceBeforeTax: 1_600_000, material: 'Fibra de bambú',
    shortDescription: '39×28×1.9 cm', variants: v('B116', 'B525') },
  { slug: 'set-platos-x6', name: 'Set Platos X6', category: 'vajilla-y-mesa', priceBeforeTax: 5_500_000, material: 'Fibra de bambú',
    shortDescription: '6 platos llanos · 22×22 cm', variants: v('B156') },
  { slug: 'salsera', name: 'Salsera', category: 'vajilla-y-mesa', priceBeforeTax: 300_000, material: 'Fibra de trigo',
    shortDescription: '9.5×4.5 cm', variants: v('T280', 'T544', 'T545') },
  { slug: 'bowl-x4', name: 'Bowl X4', category: 'vajilla-y-mesa', priceBeforeTax: 2_500_000, material: 'Fibra de trigo',
    shortDescription: '4 bowls · 11×6 cm', variants: v('T161') },
  { slug: 'fish-dips-x4', name: 'Fish Dips X4', category: 'vajilla-y-mesa', priceBeforeTax: 500_000, material: 'Fibra de trigo',
    shortDescription: '4 bowls · 11×6 cm', variants: v('T1050') },
  { slug: 'cup-400', name: 'Cup 400', category: 'vajilla-y-mesa', priceBeforeTax: 1_300_000, material: 'Fibra de trigo',
    shortDescription: '400 ml · 8.5×11.5×7.5 cm', variants: v('T793', 'T795', 'T347', 'T794') },
  { slug: 'set-vasos-x4', name: 'Set de Vasos X4', category: 'vajilla-y-mesa', priceBeforeTax: 2_000_000, material: 'Fibra de trigo',
    shortDescription: '4 vasos · 10×7 cm', variants: v('T283') },
  { slug: 'pocillo-vita', name: 'Pocillo Vita', category: 'vajilla-y-mesa', priceBeforeTax: 1_200_000, material: 'Fibra de trigo',
    shortDescription: '300 ml / 10 oz · 8.5×8 cm', variants: v('T876', 'T276', 'T538') },
  { slug: 'mantequillera', name: 'Mantequillera', category: 'vajilla-y-mesa', priceBeforeTax: 1_500_000, material: 'Fibra de bambú y acrílico',
    shortDescription: '18.5×11×6.5 cm', variants: v('B792') },

  // ─── CUBIERTOS Y PITILLOS ────────────────────────────────────────────────────
  { slug: 'pitillo-silicona', name: 'Pitillo Silicona', category: 'cubiertos-y-pitillos', priceBeforeTax: 400_000, material: 'Silicona grado alimenticio',
    shortDescription: 'A presión · 21.5×0.9 cm · se abre para limpiar · soporta calor y frío', variants: v('S912', 'S911', 'S909', 'S910') },
  { slug: 'pitillo-bambu', name: 'Pitillo Bambú', category: 'cubiertos-y-pitillos', priceBeforeTax: 130_000, material: 'Bambú natural',
    shortDescription: 'Pitillo x1 · 20×0.9 cm', variants: v('B366') },
  { slug: 'pitillo-x4-trigo', name: 'Pitillo X4 (trigo)', category: 'cubiertos-y-pitillos', priceBeforeTax: 1_300_000, material: 'Caja de fibra de trigo',
    shortDescription: 'Cuchara-pitillo · frozen/recto/curvo · limpiador · 24×5.5×3 cm', variants: v('A649') },
  { slug: 'pitillo-x4-acero', name: 'Pitillo X4 (acero)', category: 'cubiertos-y-pitillos', priceBeforeTax: 1_700_000, material: 'Acero',
    shortDescription: 'Cuchara-pitillo · frozen/recto/curvo · limpiador · caja de trigo 24×5.5×3 cm', variants: v('A100', 'A648', 'A650', 'A646') },
  { slug: 'pitillo-x3', name: 'Pitillo X3', category: 'cubiertos-y-pitillos', priceBeforeTax: 1_200_000, material: 'Acero',
    shortDescription: 'Frozen 21.5×1, recto 21.5, curvo 21×0.5 cm · bolsa de tela', variants: v('A759', 'A662', 'A655', 'A657', 'A99', 'A656', 'A663', 'A664', 'A658', 'A659') },
  { slug: 'pitillo-x1-curvo', name: 'Pitillo X1 Curvo', category: 'cubiertos-y-pitillos', priceBeforeTax: 300_000, material: 'Acero',
    shortDescription: '26×0.5 cm', variants: [{ sku: 'A234', color: 'Tornasol' }, { sku: 'A669', color: 'Negro' }, { sku: 'A670', color: 'Azul' }, { sku: 'A671', color: 'Oro rosa' }, { sku: 'A672', color: 'Dorado' }] },
  { slug: 'pitillo-x1-recto', name: 'Pitillo X1 Recto', category: 'cubiertos-y-pitillos', priceBeforeTax: 300_000, material: 'Acero',
    shortDescription: '27×0.5 cm', variants: [{ sku: 'A674', color: 'Negro' }, { sku: 'A675', color: 'Azul' }, { sku: 'A676', color: 'Oro rosa' }, { sku: 'A677', color: 'Dorado' }] },
  { slug: 'bombilla-x1', name: 'Bombilla X1', category: 'cubiertos-y-pitillos', priceBeforeTax: 700_000, material: 'Acero',
    shortDescription: '2.1×18.5 cm', variants: v('A665', 'A293', 'A667', 'A668') },
  { slug: 'cubierto-x3', name: 'Cubierto X3', category: 'cubiertos-y-pitillos', priceBeforeTax: 700_000, material: 'Fibra de trigo',
    shortDescription: 'Cuchara 16, tenedor 15, cuchillo 18.5 cm · caja 20×5×1.5 cm', variants: v('T631', 'T629', 'T630', 'T225') },
  { slug: 'cubierto-x4', name: 'Cubierto X4', category: 'cubiertos-y-pitillos', priceBeforeTax: 700_000, material: 'Fibra de trigo',
    shortDescription: 'Cuchara 18, tenedor 18, cuchillo 19, palos chinos 19 cm · caja 20×5×1.5 cm', variants: v('T633', 'T231', 'T634', 'T632') },
  { slug: 'cubierto-bambu', name: 'Cubierto Bambú', category: 'cubiertos-y-pitillos', priceBeforeTax: 1_500_000, material: 'Bambú',
    shortDescription: 'Cuchara, tenedor, cuchillo, palos, pitillo y limpiador · bolsa de tela con broche', variants: v('B367') },
  { slug: 'cubierto-mango-negro', name: 'Cubierto Mango Negro', category: 'cubiertos-y-pitillos', priceBeforeTax: 4_000_000, material: 'Acero 304',
    shortDescription: 'Cuchara, tenedor, cuchillo, cucharita · caja de trigo · bolsa de tela', variants: v('T641', 'T319') },
  { slug: 'cubierto-pitillo', name: 'Cubierto + Pitillo', category: 'cubiertos-y-pitillos', priceBeforeTax: 2_500_000, material: 'Acero 304',
    shortDescription: 'Cuchara, tenedor, cuchillo · pitillo recto y curvo · caja y bolsa de tela', variants: v('A635', 'A639', 'A638', 'A232') },
  { slug: 'cuchara-x1', name: 'Cuchara X1', category: 'cubiertos-y-pitillos', priceBeforeTax: 700_000, material: 'Acero 304',
    shortDescription: '17×3 cm', variants: v('A643', 'A644', 'A645', 'A292', 'A642') },
  { slug: 'cuchara-sopera', name: 'Cuchara Sopera', category: 'cubiertos-y-pitillos', priceBeforeTax: 600_000, material: 'Fibra de trigo',
    shortDescription: '23×7 cm', variants: v('T746', 'T747', 'T287', 'T748') },
  { slug: 'cuchara-pez', name: 'Cuchara Pez', category: 'cubiertos-y-pitillos', priceBeforeTax: 600_000, material: 'Fibra de trigo',
    shortDescription: '7.5×20 cm', variants: v('T743', 'T744', 'T111', 'T745') },
  { slug: 'cubierto-unit-x3', name: 'Cubierto Unit X3', category: 'cubiertos-y-pitillos', priceBeforeTax: 500_000, material: 'Fibra de trigo',
    shortDescription: 'Cuchara, tenedor, cuchillo · ensamble en 1 pieza', variants: v('T1046', 'T1044', 'T1047', 'T1045') },

  // ─── HOGAR Y COCINA ──────────────────────────────────────────────────────────
  { slug: 'jabonera-grande', name: 'Jabonera Grande', category: 'hogar-y-cocina', priceBeforeTax: 700_000, material: 'Bambú',
    shortDescription: '8.5×12.5 cm · alto 2 cm', variants: v('B882') },
  { slug: 'jabonera-mediana', name: 'Jabonera Mediana', category: 'hogar-y-cocina', priceBeforeTax: 700_000, material: 'Bambú',
    shortDescription: '8×12 cm · alto 1.2 cm', variants: v('B932') },
  { slug: 'jabonera-carrot', name: 'Jabonera Carrot', category: 'hogar-y-cocina', priceBeforeTax: 550_000, material: 'Fibra de trigo',
    shortDescription: 'Diseño zanahoria', variants: v('T1035', 'T1034', 'T1033', 'T1032') },
  { slug: 'jabonera-happy', name: 'Jabonera Happy', category: 'hogar-y-cocina', priceBeforeTax: 550_000, material: 'Fibra de trigo',
    shortDescription: '13×6 cm', variants: v('T1036', 'T1037', 'T1038', 'T1039') },
  { slug: 'moshi-dispensador', name: 'Moshi Dispensador', category: 'hogar-y-cocina', priceBeforeTax: 1_000_000, material: 'Silicona',
    shortDescription: '120 ml · 18.5×8×5.3 cm · 105 g', variants: v('S908', 'S907') },
  { slug: 'bloop-dispensador', name: 'Bloop Dispensador', category: 'hogar-y-cocina', priceBeforeTax: 700_000, material: 'Silicona',
    shortDescription: '110 ml', variants: v('S938', 'S939') },
  { slug: 'pocket-case', name: 'Pocket Case', category: 'hogar-y-cocina', priceBeforeTax: 900_000, material: 'Silicona',
    shortDescription: 'Almacenador especial para brochas · 22×7 cm', variants: v('O983', 'O982', 'O981') },
  { slug: 'kippi-500', name: 'Kippi 500', category: 'hogar-y-cocina', priceBeforeTax: 1_500_000, material: 'Silicona',
    shortDescription: '500 ml · 16×(8+3) cm · microondas/horno/congelador/nevera', variants: v('O986', 'O985', 'O984') },
  { slug: 'kippi-1000', name: 'Kippi 1.000', category: 'hogar-y-cocina', priceBeforeTax: 2_000_000, material: 'Silicona',
    shortDescription: '1000 ml · microondas/horno/congelador/nevera', variants: v('O987', 'O989', 'O988') },
  { slug: 'jarra-silicona', name: 'Jarra Silicona', category: 'hogar-y-cocina', priceBeforeTax: 5_500_000, material: 'Silicona',
    shortDescription: 'Gas / inducción · 21.7×17×16 cm · 385 g · -40 a 230 °C', variants: v('S1095') },
  { slug: 'hielera-silicona', name: 'Hielera Silicona', category: 'hogar-y-cocina', priceBeforeTax: 900_000, material: 'Silicona',
    shortDescription: '6 compartimientos · 12×4 cm · frío y calor', variants: v('S1078') },
  { slug: 'difusor', name: 'Difusor', category: 'hogar-y-cocina', priceBeforeTax: 3_000_000,
    shortDescription: 'Luz LED amarilla · 500 ml · 9×9×13.5 cm · esencia hidrosoluble · recargable', variants: v('D353') },

  // ─── CUIDADO PERSONAL Y BAÑO ─────────────────────────────────────────────────
  { slug: 'almohada-warm', name: 'Almohada Warm', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Bolsa de agua caliente · 26×17 cm', variants: v('S1060', 'S1063', 'S1062', 'S1061') },
  { slug: 'almohada-pingui', name: 'Almohada Pingüi', category: 'cuidado-personal-y-bano', priceBeforeTax: 2_800_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Bolsa de agua caliente · 17×25.5 cm', variants: v('S1067', 'S1066', 'S1064', 'S1065') },
  { slug: 'almohada-animals', name: 'Almohada Animals', category: 'cuidado-personal-y-bano', priceBeforeTax: 2_400_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Bolsa de agua caliente', variants: v('S1073', 'S1072', 'S1074', 'S1075') },
  { slug: 'copa-menstrual-s', name: 'Copa Menstrual S', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_000_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Clásica · 20 ml · talla S', variants: v('S213', 'S797', 'S798') },
  { slug: 'copa-menstrual-l', name: 'Copa Menstrual L', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_000_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Clásica · 25 ml · talla L', variants: v('S799', 'S212', 'S800') },
  { slug: 'copa-flip-s', name: 'Copa Flip S', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_200_000, material: 'Silicona hipoalergénica',
    shortDescription: '20 ml · talla S', variants: v('S809', 'S808', 'S810') },
  { slug: 'copa-flip-l', name: 'Copa Flip L', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_200_000, material: 'Silicona hipoalergénica',
    shortDescription: '25 ml · talla L', variants: v('S812', 'S811', 'S814') },
  { slug: 'disco-punto-l', name: 'Disco Punto L', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_700_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Talla L', variants: v('S306') },
  { slug: 'disco-agarre-s', name: 'Disco Agarre S', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Fácil de retirar · talla S', variants: v('S710') },
  { slug: 'disco-agarre-l', name: 'Disco Agarre L', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Fácil de retirar · talla L', variants: v('S271', 'S270', 'S711') },
  { slug: 'disco-s', name: 'Disco S', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Ultradelgado · talla S', variants: v('S714', 'S223') },
  { slug: 'disco-l', name: 'Disco L', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Silicona hipoalergénica',
    shortDescription: 'Ultradelgado · talla L', variants: v('S716', 'S224', 'S715') },
  { slug: 'estuche-disco', name: 'Estuche de Disco', category: 'cuidado-personal-y-bano', priceBeforeTax: 600_000, material: 'Silicona',
    shortDescription: '9×4 cm', variants: v('S709', 'S308') },
  { slug: 'pulpo-cepillo-cara', name: 'Pulpo Cepillo de Cara', category: 'cuidado-personal-y-bano', priceBeforeTax: 300_000, material: 'Silicona',
    shortDescription: '5×5 cm · 14 g', variants: v('S895', 'S894', 'S892', 'S893') },
  { slug: 'cuchilla-afeitar', name: 'Cuchilla de Afeitar', category: 'cuidado-personal-y-bano', priceBeforeTax: 400_000, material: 'Bambú y fibra de trigo',
    shortDescription: 'Reutilizable · caja de cartón', variants: v('B945') },
  { slug: 'portacepillo', name: 'Portacepillo', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_000_000, material: 'Bambú',
    shortDescription: '21×2.8 cm · caja de cartón', variants: v('B364') },
  { slug: 'base-cepillo', name: 'Base para Cepillo de Dientes', category: 'cuidado-personal-y-bano', priceBeforeTax: 350_000, material: 'Bambú natural',
    shortDescription: '4×4 cm · 28 g · con caja', variants: v('B362') },
  { slug: 'cepillo-dientes-premium', name: 'Cepillo de Dientes Premium', category: 'cuidado-personal-y-bano', priceBeforeTax: 450_000, material: 'Bambú natural',
    shortDescription: '19×1 cm · cerdas medias · caja individual',
    variants: [{ sku: 'B865', color: 'Blanco' }, { sku: 'B520', color: 'Morado' }, { sku: 'B519', color: 'Rosa' }, { sku: 'B518', color: 'Azul' }, { sku: 'B238', color: 'Negro' }] },
  { slug: 'cepillo-dientes-clasico', name: 'Cepillo de Dientes Clásico', category: 'cuidado-personal-y-bano', priceBeforeTax: 400_000, material: 'Bambú natural',
    shortDescription: '17.5×1.3 cm · cerdas suaves/medias · caja individual',
    variants: [{ sku: 'B515', color: 'Verde' }, { sku: 'B512', color: 'Morado' }, { sku: 'B511', color: 'Rojo' }, { sku: 'B509', color: 'Azul' }, { sku: 'B508', color: 'Arcoíris' }, { sku: 'B516', color: 'Beige' }, { sku: 'B507', color: 'Blanco' }, { sku: 'B200', color: 'Negro' }, { sku: 'B514', color: 'Turquesa' }, { sku: 'B513', color: 'Rosa' }, { sku: 'B510', color: 'Amarillo' }] },
  { slug: 'desmaquillador', name: 'Desmaquillador', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_900_000, material: 'Algodón reutilizable',
    shortDescription: 'Bolsa + 10 pads · bolsa 17×4 cm · pad 8.5 cm', variants: v('B215') },
  { slug: 'set-esponja-cocina', name: 'Set Esponja para Cocina', category: 'cuidado-personal-y-bano', priceBeforeTax: 4_000_000,
    shortDescription: '1 mango + cepillo + 2 repuestos + estropajo + caja', variants: v('B333') },
  { slug: 'kinu-exfoliante', name: 'Kinu (cepillo exfoliante)', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_400_000, material: 'Bambú',
    shortDescription: '7×11 cm · caja de cartón', variants: v('P973') },
  { slug: 'exfoliante-masaje', name: 'Exfoliante + Masaje', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Bambú',
    shortDescription: '10.5×3.5 cm · caja de cartón', variants: v('P321') },
  { slug: 'luma-exfoliante', name: 'Luma (cepillo exfoliante)', category: 'cuidado-personal-y-bano', priceBeforeTax: 900_000, material: 'Bambú',
    shortDescription: '20×8 cm', variants: v('P974') },
  { slug: 'kora-exfoliante', name: 'Kora (exfoliante + masaje)', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Bambú',
    shortDescription: '41×10.5 cm', variants: v('P975') },
  { slug: 'lira-exfoliante', name: 'Lira (cepillo exfoliante)', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_600_000, material: 'Bambú',
    shortDescription: '41×10.5 cm', variants: v('P976') },
  { slug: 'peinilla', name: 'Peinilla', category: 'cuidado-personal-y-bano', priceBeforeTax: 350_000, material: 'Bambú',
    shortDescription: '14×3 cm · caja de cartón', variants: v('P363') },
  { slug: 'peinilla-antifrizz', name: 'Peinilla Antifrizz', category: 'cuidado-personal-y-bano', priceBeforeTax: 800_000, material: 'Bambú',
    shortDescription: '13.5×5 cm', variants: v('P323') },
  { slug: 'peine-pequeno', name: 'Peine Pequeño', category: 'cuidado-personal-y-bano', priceBeforeTax: 600_000, material: 'Bambú',
    shortDescription: '16.5×4 cm', variants: v('P273') },
  { slug: 'peine-mini', name: 'Peine Mini', category: 'cuidado-personal-y-bano', priceBeforeTax: 900_000, material: 'Bambú',
    shortDescription: '15×6 cm · caja de cartón', variants: v('P397', 'P660', 'P931', 'P661') },
  { slug: 'peine-ovalado', name: 'Peine Ovalado Liso', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_200_000, material: 'Bambú',
    shortDescription: '7.4×22.5 cm · caja de cartón', variants: v('P210') },
  { slug: 'peine-negro', name: 'Peine Negro', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_000_000, material: 'Bambú',
    shortDescription: '7×22 cm · caja de cartón', variants: v('P211') },
  { slug: 'peine-rayas', name: 'Peine de Rayas', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_200_000, material: 'Bambú',
    shortDescription: 'Cuadrado · 9×25 cm', variants: v('P921', 'P920') },
  { slug: 'peine-cuadrado', name: 'Peine Cuadrado Liso', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_200_000, material: 'Bambú',
    shortDescription: '9×25 cm', variants: v('P208', 'P919', 'P653', 'P651', 'P652', 'P209') },
  { slug: 'peine-curly', name: 'Peine Curly', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_900_000, material: 'Fibra de trigo',
    shortDescription: 'Especial para crespos · 24×7 cm · 79 g',
    variants: [{ sku: 'P922', color: 'Blanco' }, { sku: 'P886', color: 'Rosa' }, { sku: 'P884', color: 'Menta' }, { sku: 'P883', color: 'Negro' }] },
  { slug: 'guante-bano', name: 'Guante de Baño', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_300_000, material: 'Silicona',
    shortDescription: 'Exfoliante suave · redondo doble cara', variants: v('S903', 'S901', 'S902') },
  { slug: 'stick-bano', name: 'Stick de Baño', category: 'cuidado-personal-y-bano', priceBeforeTax: 2_000_000, material: 'Silicona',
    shortDescription: 'Exfoliante de mango largo · 37.7×8.2 cm', variants: v('S904', 'S906', 'S905') },
  { slug: 'glow-limpiador-facial', name: 'Glow Limpiador Facial', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_400_000, material: 'Silicona',
    shortDescription: 'Vibrador ultrasónico · batería 90 min · a prueba de agua · 9×6.5 cm', variants: v('O990') },
  { slug: 'ice-roller', name: 'Ice Roller', category: 'cuidado-personal-y-bano', priceBeforeTax: 1_300_000,
    shortDescription: 'Rodillo frío · 5×6.8×11 cm', variants: v('S896') },
  { slug: 'panitos-bambu-algodon', name: 'Pañitos Bambú + Algodón', category: 'cuidado-personal-y-bano', priceBeforeTax: 500_000, material: '100% bambú + algodón',
    shortDescription: 'Libres de plástico · suaves y resistentes · caja x200 unidades', variants: v('B201', 'B693') },

  // ─── BEBÉ ────────────────────────────────────────────────────────────────────
  { slug: 'vajilla-bb', name: 'Vajilla BB', category: 'bebe', priceBeforeTax: 4_300_000, material: 'Silicona grado alimenticio',
    shortDescription: 'Babero + plato con divisiones + sopa + bottle + tapa snacks + cuchara + tenedor', variants: v('S890', 'S889', 'S887', 'S891', 'S888') },
  { slug: 'babero-bb', name: 'Babero BB', category: 'bebe', priceBeforeTax: 900_000, material: 'Silicona libre de BPA',
    shortDescription: 'Bolsillo recoge-migas · impermeable y flexible', variants: v('S900', 'S897', 'S898', 'S899') },

  // ─── BOLSAS ──────────────────────────────────────────────────────────────────
  { slug: 'bolsa-ecommerce-17x30', name: 'Bolsa E-commerce 17×30', category: 'bolsas', priceBeforeTax: 1_200_000, material: 'Compostable, impermeable',
    shortDescription: '17×30 cm · paquete x50 · cinta fácil de cerrar', variants: v('T917') },
  { slug: 'bolsa-ecommerce-25x35', name: 'Bolsa E-commerce 25×35', category: 'bolsas', priceBeforeTax: 1_800_000, material: 'Compostable, impermeable',
    shortDescription: '25×35 cm · paquete x50', variants: v('T918') },
  { slug: 'bolsa-ecommerce-35x46', name: 'Bolsa E-commerce 35×46', category: 'bolsas', priceBeforeTax: 3_000_000, material: 'Compostable, impermeable',
    shortDescription: '35×46 cm · paquete x50', variants: v('T1056') },
];

async function main(): Promise<void> {
  const catIdBySlug = new Map<string, number>();
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
    catIdBySlug.set(c.slug, cat.id);
  }

  for (const p of products) {
    const categoryId = catIdBySlug.get(p.category);
    if (categoryId === undefined) throw new Error(`Categoría desconocida en seed: ${p.category} (producto ${p.slug})`);

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        priceBeforeTax: p.priceBeforeTax,
        material: p.material ?? null,
        shortDescription: p.shortDescription ?? null,
        categoryId,
        active: true,
      },
      create: {
        slug: p.slug,
        name: p.name,
        priceBeforeTax: p.priceBeforeTax,
        material: p.material ?? null,
        shortDescription: p.shortDescription ?? null,
        categoryId,
        active: true,
      },
    });

    for (const variant of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { productSlug: p.slug, color: variant.color ?? null }, // no toca stock en re-seed
        create: { sku: variant.sku, productSlug: p.slug, color: variant.color ?? null, stock: DEFAULT_STOCK },
      });
    }
  }

  const [nCat, nProd, nVar] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);
  console.log(`Seed OK → ${nCat} categorías · ${nProd} productos · ${nVar} variantes (SKUs).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed falló:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
