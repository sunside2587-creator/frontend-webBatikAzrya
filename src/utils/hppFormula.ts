import { BUSINESS_CONSTANTS } from '../constants';
import type {
  HppBreakdownResult,
  HppLaborCost,
  HppMaterialItem,
  HppOverheadCost,
} from '../types';

interface CalculateHppParams {
  bahan?: HppMaterialItem[];
  tenagaKerja?: Partial<HppLaborCost>;
  overhead?: Partial<HppOverheadCost>;
  yieldCount?: number;
  marginTarget?: number;
  hargaKustom?: number | string;
}

export function calculateHppBreakdown({
  bahan = [],
  tenagaKerja = {},
  overhead = {},
  yieldCount = 1,
  marginTarget = BUSINESS_CONSTANTS.DEFAULT_MARGIN_TARGET_PCT / 100,
  hargaKustom = 0,
}: CalculateHppParams): HppBreakdownResult {
  const safeYield = Math.max(1, Number(yieldCount) || 1);
  const safeMargin = Math.min(
    BUSINESS_CONSTANTS.MAX_MARGIN_RATIO,
    Math.max(0, Number(marginTarget) || 0)
  );

  const bb = bahan.reduce((sum, item) => {
    const qty = Math.max(0, Number(item.pemakaian) || 0);
    const harga = Math.max(0, Number(item.harga_satuan) || 0);
    const susut = Math.max(0, Number(item.susut) || 0);
    return sum + qty * harga * (1 + susut);
  }, 0);

  const meterCanting = Math.max(0, Number(tenagaKerja.meter_canting) || 0);
  const upahPerMeter = Math.max(0, Number(tenagaKerja.upah_canting_per_meter) || 0);
  const upahWarna = Math.max(0, Number(tenagaKerja.upah_warna) || 0);
  const upahLorod = Math.max(0, Number(tenagaKerja.upah_lorod) || 0);
  const tkl = meterCanting * upahPerMeter + upahWarna + upahLorod;

  const np = Math.max(0, Number(overhead.np) || 0);
  const ns = Math.max(0, Number(overhead.ns) || 0);
  const up = Math.max(1, Number(overhead.up) || 1);
  const alokasi = Math.max(0, Number(overhead.alokasi) || 0);
  const penyusutan = Math.max(0, ((np - ns) / up) * alokasi);
  const energi = Math.max(0, Number(overhead.energi) || 0);
  const kemasan = Math.max(0, Number(overhead.kemasan) || 0);
  const bop = penyusutan + energi + kemasan;

  const totalProduksi = bb + tkl + bop;
  const hppUnit = Math.round(totalProduksi / safeYield);
  const hargaSaran = safeMargin < 1 ? Math.round(hppUnit / (1 - safeMargin)) : hppUnit;
  const marginNominalSaran = Math.max(0, hargaSaran - hppUnit);

  const hargaKustomNum = Math.max(0, Number(hargaKustom) || 0);
  const isBelowHpp = hargaKustomNum > 0 && hargaKustomNum < hppUnit;
  const selisihKustom = hargaKustomNum - hppUnit;
  const marginPersenKustom =
    hargaKustomNum > 0 ? ((hargaKustomNum - hppUnit) / hargaKustomNum) * 100 : 0;

  const totalSafe = totalProduksi > 0 ? totalProduksi : 1;
  const pctBb = Math.round((bb / totalSafe) * 100);
  const pctTkl = Math.round((tkl / totalSafe) * 100);
  const pctBop = Math.max(0, 100 - pctBb - pctTkl);

  return {
    bb: Math.round(bb),
    tkl: Math.round(tkl),
    penyusutan: Math.round(penyusutan),
    bop: Math.round(bop),
    totalProduksi: Math.round(totalProduksi),
    hpp_unit: hppUnit,
    harga_saran: hargaSaran,
    margin_nominal_saran: marginNominalSaran,
    margin_persen_target: Math.round(safeMargin * 100),
    is_below_hpp: isBelowHpp,
    selisih_kustom: Math.round(selisihKustom),
    margin_persen_kustom: marginPersenKustom,
    komposisi: {
      bb: pctBb,
      tkl: pctTkl,
      bop: pctBop,
    },
  };
}
