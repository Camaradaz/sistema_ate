
import { Users, Building2 } from 'lucide-react';

interface Sector {
  id: number;
  name: string;
  code: string;
  affiliateCount: number; // This would come from your database
}

export const sectors: Sector[] = [
  { id: 1, name: 'ANSES', code: 'B020N0501100', affiliateCount: 25 },
  { id: 2, name: 'A.R.B.A.', code: 'B020P0710000', affiliateCount: 15 },
  { id: 3, name: 'JEF.ASES. DEL GOBERNADOR', code: 'B020P1300000', affiliateCount: 10 },
  { id: 4, name: 'PATRONATO DE LIBERADOS', code: 'B020P1100000', affiliateCount: 20 },
  { id: 5, name: 'SUB-SEC. TRABAJO', code: 'B020P1200000', affiliateCount: 30 },
  { id: 6, name: 'I.N.S.S.J.Y.P.-PAMI-', code: 'B020N1220004', affiliateCount: 40 },
  { id: 7, name: 'CONS. PCIAL. DEL MENOR', code: 'B020P2000000', affiliateCount: 12 },
  { id: 8, name: 'MIN.SALUD PUBLICA', code: 'B020P2300000', affiliateCount: 50 },
  { id: 9, name: 'SECRETARIA DE ADICCIONES', code: 'B020P2310000', affiliateCount: 18 },
  { id: 10, name: 'SUBS.DE COORD.Y AT.DE SAL', code: 'B020P2302006', affiliateCount: 22 },
  { id: 11, name: 'HOSPITAL ANA GOITIA', code: 'B020P2302002', affiliateCount: 45 },
  { id: 12, name: 'HOSPITAL PTE PERON', code: 'B020P2302004', affiliateCount: 60 },
  { id: 13, name: 'HOSPITAL FIORITO', code: 'B020P2302005', affiliateCount: 55 },
  { id: 14, name: 'HOSPITAL DE WILDE', code: 'B020P2302007', affiliateCount: 48 },
  { id: 15, name: 'U.P.A UNIDAD 2 24 HS', code: 'B020P2302008', affiliateCount: 15 },
  { id: 16, name: 'MRIO. EDUCACION', code: 'B020P4000000', affiliateCount: 70 },
  { id: 17, name: 'MUNICIP. AVELLANEDA', code: 'B020M0307002', affiliateCount: 100 },
  { id: 18, name: 'JUBILADOS Y PENS.PCIALES', code: 'B02JPJ000000', affiliateCount: 200 },
  { id: 19, name: 'JUBILADOS Y PENS.NACIONALES', code: 'B02JNJ000000', affiliateCount: 180 },
  { id: 20, name: 'I.O.M.A', code: 'B020P2402027', affiliateCount: 35 },
  { id: 21, name: 'CAMARA DE DIPUTADOS', code: 'B020PL000001', affiliateCount: 25 }
];

function SectorsPage() {
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Sectores</h1>
          <div className="flex items-center gap-2 text-emerald-600">
            <Building2 className="w-6 h-6" />
            <span className="text-lg font-semibold">Total de Sectores: {sectors.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => (
            <div
              key={sector.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-600">
                    {sector.affiliateCount} Afiliados
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 h-14">
                {sector.name}
              </h3>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Código de Sector:</span>
                  <p className="font-mono text-gray-700">{sector.code}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default SectorsPage;