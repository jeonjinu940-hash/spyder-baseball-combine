// 대한민국 시·도 경계 → SVG path JSON 변환 (src/data/korea-map.json)
// 원본: southkorea/southkorea-maps kostat 2018 시·도 경계 (EPSG:4326)
//   https://github.com/southkorea/southkorea-maps (kostat/2018/json/skorea-provinces-2018-geo.json)
// 원본(7.5MB) 대신 위상 보존 TopoJSON(scripts/geo/skorea-provinces-2018-topo.json)을 커밋해 사용한다.
// 사용: npm run build:map
//       원본에서 TopoJSON 다시 만들기: npm run build:map -- --from <skorea-provinces-2018-geo.json>
// 투영은 웹 지도(구글 지도 등)와 같은 메르카토르 — 지역 모양·비율이 구글 지도와 같다.
import { readFileSync, writeFileSync } from 'node:fs';
import { geoMercator, geoPath } from 'd3-geo';
import { topology } from 'topojson-server';
import { presimplify, simplify, filter, filterWeight, sphericalRingArea } from 'topojson-simplify';
import { feature } from 'topojson-client';

const TOPO = new URL('./geo/skorea-provinces-2018-topo.json', import.meta.url);
const OUT = new URL('../src/data/korea-map.json', import.meta.url);

// 지도 영역 key ↔ 원본 시·도명
const KEY_BY_NAME = {
  서울특별시: 'seoul', 부산광역시: 'busan', 대구광역시: 'daegu', 인천광역시: 'incheon',
  광주광역시: 'gwangju', 대전광역시: 'daejeon', 울산광역시: 'ulsan', 세종특별자치시: 'sejong',
  경기도: 'gyeonggi', 강원도: 'gangwon', 충청북도: 'chungbuk', 충청남도: 'chungnam',
  전라북도: 'jeonbuk', 전라남도: 'jeonnam', 경상북도: 'gyeongbuk', 경상남도: 'gyeongnam',
  제주특별자치도: 'jeju',
};

// 단순화 기준: 점 하나를 지웠을 때 생기는 삼각형 면적(도² 단위)
const PREP_W = 1e-7; // TopoJSON 저장용(아주 미세한 굴곡만 제거)
const SIMPLIFY_W = 2e-5; // 화면용(지도 크기에서 1px 미만 굴곡 제거)
const MIN_AREA = 2e-7; // 이보다 작은 섬은 생략(스테라디안 ≈ 8km²), 울릉도·독도는 항상 유지

const fromIdx = process.argv.indexOf('--from');
if (fromIdx > 0) {
  // 원본 GeoJSON → 가볍게 단순화한 TopoJSON (경계 공유 → 시·도 사이 틈 없음)
  const geo = JSON.parse(readFileSync(process.argv[fromIdx + 1], 'utf8'));
  geo.features.forEach((f) => { f.properties = { name: f.properties.name }; });
  let topo = presimplify(topology({ provinces: geo }));
  topo = simplify(topo, PREP_W);
  // 단순화 가중치(z) 제거, 좌표는 소수 4자리(약 10m)로 저장
  const r4 = (v) => Math.round(v * 1e4) / 1e4;
  topo.arcs = topo.arcs.map((arc) => arc.map(([x, y]) => [r4(x), r4(y)]));
  writeFileSync(TOPO, JSON.stringify(topo));
  console.log(`TopoJSON 생성: ${topo.arcs.reduce((s, a) => s + a.length, 0)} points`);
}

let topo = presimplify(JSON.parse(readFileSync(TOPO, 'utf8')));
topo = filter(topo, filterWeight(topo, MIN_AREA, (ring, interior) =>
  !interior && ring.some(([lon]) => lon > 130.5) ? Infinity : sphericalRingArea(ring, interior)));
topo = simplify(topo, SIMPLIFY_W);
const geo = feature(topo, topo.objects.provinces);

// 울릉도·독도(동경 130.5° 동쪽)는 본토와 같은 축척으로 우측 하단 별도 박스에 그린다
// (일반 지도의 표기 방식) — 본토를 화면에 더 크게 보여주기 위해.
const ISLAND_LON = 130.5;
const isFar = (poly) => poly[0].some(([lon]) => lon > ISLAND_LON);
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const mainGeo = {
  type: 'FeatureCollection',
  features: geo.features.map((f) => ({
    ...f, geometry: { type: 'MultiPolygon', coordinates: polys(f.geometry).filter((p) => !isFar(p)) },
  })),
};
const farGeo = {
  type: 'MultiPolygon',
  coordinates: geo.features.flatMap((f) => polys(f.geometry).filter(isFar)),
};

// 가로 폭에 맞추고 세로는 실제 비율대로(빈 여백 없이)
const W = 560;
const PAD = 14;
const projection = geoMercator().fitWidth(W - PAD * 2, mainGeo);
const [[, y0], [, y1]] = geoPath(projection).bounds(mainGeo);
const H = Math.ceil(y1 - y0 + PAD * 2);
projection.translate(projection.translate().map((t, i) => t + (i ? PAD - y0 : PAD)));
const path = geoPath(projection).digits(1);

// 섬 박스: 같은 축척, 우측 하단(남해 동쪽) 빈 바다 위치
const BOX_PAD = 12;
const islandProj = geoMercator().scale(projection.scale()).translate([0, 0]);
const [[ix0, iy0], [ix1, iy1]] = geoPath(islandProj).bounds(farGeo);
const inset = {
  w: Math.ceil(ix1 - ix0 + BOX_PAD * 2),
  h: Math.ceil(iy1 - iy0 + BOX_PAD * 2 + 16), // 아래 16은 이름 표기 자리
};
inset.x = W - PAD - inset.w;
inset.y = H - PAD - inset.h;
islandProj.translate([inset.x + BOX_PAD - ix0, inset.y + BOX_PAD - iy0]);
const islandPath = geoPath(islandProj).digits(1);

const regions = geo.features.map((f, i) => {
  const key = KEY_BY_NAME[f.properties.name];
  if (!key) throw new Error(`Unknown province: ${f.properties.name}`);
  const main = mainGeo.features[i];
  const [cx, cy] = path.centroid(main);
  const far = polys(f.geometry).filter(isFar);
  const d = path(main) + (far.length ? islandPath({ type: 'MultiPolygon', coordinates: far }) : '');
  return { key, name: f.properties.name, d, cx: Math.round(cx), cy: Math.round(cy) };
});

// 섬 이름 위치(독도는 화면에서 1px보다 작아 점으로 표시)
const pt = (lonlat) => islandProj(lonlat).map((v) => Math.round(v * 10) / 10);
inset.islands = [
  { name: '울릉도', at: pt([130.865, 37.497]) },
  { name: '독도', at: pt([131.867, 37.242]), dot: true },
];

const json = JSON.stringify({ width: W, height: H, inset, regions });
writeFileSync(OUT, json);
console.log(`korea-map.json: ${regions.length} regions, ${(json.length / 1024).toFixed(0)}KB`);
