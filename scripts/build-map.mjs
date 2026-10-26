// 대한민국 시·도 경계 GeoJSON → SVG path JSON 변환
// 원본: southkorea/southkorea-maps (kostat 2013, simplified)
// 사용: npm run build:map
import { readFileSync, writeFileSync } from 'node:fs';
import { geoMercator, geoPath } from 'd3-geo';

const SRC = new URL('./geo/skorea_provinces_geo_simple.json', import.meta.url);
const OUT = new URL('../src/data/korea-map.json', import.meta.url);

// 지도 영역 key ↔ 원본 시·도명
const KEY_BY_NAME = {
  서울특별시: 'seoul', 부산광역시: 'busan', 대구광역시: 'daegu', 인천광역시: 'incheon',
  광주광역시: 'gwangju', 대전광역시: 'daejeon', 울산광역시: 'ulsan', 세종특별자치시: 'sejong',
  경기도: 'gyeonggi', 강원도: 'gangwon', 충청북도: 'chungbuk', 충청남도: 'chungnam',
  전라북도: 'jeonbuk', 전라남도: 'jeonnam', 경상북도: 'gyeongbuk', 경상남도: 'gyeongnam',
  제주특별자치도: 'jeju',
};

const W = 520;
const H = 720;
const geo = JSON.parse(readFileSync(SRC, 'utf8'));
const projection = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], geo);
const path = geoPath(projection).digits(1);

const regions = geo.features.map((f) => {
  const key = KEY_BY_NAME[f.properties.name];
  if (!key) throw new Error(`Unknown province: ${f.properties.name}`);
  const [cx, cy] = path.centroid(f);
  return { key, name: f.properties.name, d: path(f), cx: Math.round(cx), cy: Math.round(cy) };
});

writeFileSync(OUT, JSON.stringify({ width: W, height: H, regions }));
console.log(`korea-map.json: ${regions.length} regions`);
