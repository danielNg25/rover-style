import React, {useMemo, useRef, useLayoutEffect} from 'react';
import {AbsoluteFill, Composition, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import CATALOG from '../../assets/catalog.json';
import {Sprite, Ctx, paintPeak, paintHills, paintPine, paintTree, paintBush, paintHaystack, paintRock, paintHouse, paintCastle, paintCloud, paintTuft, paintKarst, paintBamboo, paintPalm, paintBanana,
  paintBanyan, paintBuffalo, paintEgret, paintChicken, paintPagoda, paintSchoolBlock, paintAlmondTree, paintSchoolbag, paintPotPlant, paintBouquet, paintBroom, paintFlameTree, paintWaterTower, paintSmoke} from '../lib3/depth';
import {B, Road, Fence, Cottage, ThatchHouse, Gate, BambooFence, Tent, Wagon, Lantern, LogSeat, Fire, paintWood, Fireflies, Well, Crate, Barrel, Sack, Jar, Label, Track, Locomotive, Carriage, Platform,
  StationShelter, Bench, StationLamp, Semaphore, PoleLine, CarryBaskets, LocoSmoke, FlyingLeaves, Motes, mapNETex, SineWave, MapInsert, HandTorch, HeldPole, WoodBowl, HandLantern, AutoRecv} from '../lib3/kit';
import {WindowWall, Cabinet, TeacherDesk, Desk, CeilingFan} from '../lib3/room';
import {LectureHall, Dormitory, CampusLamp, StoneBench, FounderStatue, BikeRack, IronGate, PavedPath, FallenLeaves, paintMaple, paintIvy} from '../lib3/kitCampus';
import {DriftSpecks, paintBurnt, HangingSheet, BurntSheet, BrokenArchWindow, FloorDecal, scorchTex, EmberBed, WreckedMachine, DeskOverturned, FallenLamp, SpiltPapers, BookPile, BOOKPILE, PhotoCracked, SheetMarks, SoftShadow, CALC_LINES, Machine, LabDesk, Stool, IronBed, PendulumClock, CrookedShelf, GlassShelf, LabDoor, Rug, Cable, Sheet, tex, paintPlan, calcSheetTex, boardTex, portraitTex, deskPlanTex} from '../lib3/kitLab';
import {MonHang} from '../lib3/khoiTuAnh';
import {GRADES, GradeCtx, Grade, Halo} from '../lib3/look';
import {Portal, Arc, FlyingPapers, Explosion, SmokeDrift, Embers, RingLightning, BulbHalo, beyondTex, Steam, SparkBurst, HotSpecks, RimSparks} from '../lib3/fx';
import {Puppet3} from '../mould/Puppet3';
import {paint as paintFigure, Spec, BOX} from '../mould/draw';
import {EXPR} from '../mould/expr';
import {matChuan} from '../mould/matChuan';
import {POSES, PoseName, withPose} from '../mould/gestures';
import {SKINS, SkinName} from '../mould/palettes';
// người mẫu của phần chung (bản chép nguyên giá trị, xem mould/nguoi-mau.ts); tên cũ giữ làm bí danh để các ảnh xem trước không đổi một chữ
import {NAM_MAU as VICTOR, ONG_MAU as DEAN, BA_MAU as MOTHER, sinhVien as student, GIAP_MAU as DOOM, BE_AO_CHOANG_MAU as VICTOR_BOY_CLOAK, THAN_DAN_MAU as HALL_SUBJECTS, CAO_MAU} from '../mould/nguoi-mau';
const HEIGHT = {student: CAO_MAU.sinhVien};
import {MASTER, BOY} from '../demo/Station';
import {Still as CampusStill} from '../demo/Campus';
import {Lab} from '../demo/Lab';
import {GiangDuong} from '../demo/Classroom';
import {Finish as LabFinish} from '../lib3/look';
import {Townhouse, PowerStation, StoneOffice, KnifeSwitch, ElectricLamp, GasGlow, WirePoles, CobbleRoad, Sidewalk, Trench, DirtThrow, paintBridgeTower} from '../lib3/kitNyStreet';
import {EDISON, TESLA_LAB, TESLA_WORN, TESLA_FAIR, WESTINGHOUSE, extra, HEIGHT as TH} from '../episodes/teslaCast';
import {Palace, palaceBulbs, DomeHall, BulbField, bulbLine, Lake, Mirror, Searchlight, Balustrade, FairLamp, paintGoldStatue, paintWalkers, FAIR_LIT} from '../lib3/kitChicagoFair';
import {PaintedWall, WallCalendar, WallSocket, Cable as HomeCable, SideTable, DeskLamp, TeaCup} from '../lib3/kitHomeCorner';
import {ForgeHearth, Bellows, ToolRack, Thangka, ButterLamps, QuenchTub, CoalSack, Anvil, ANVIL, LooseMask, LowBench, HammerArm, ELBOW} from '../lib3/kitForge';
import {NomadTent, PlankCrate, Cask, Bucket, ClayPot, Basket, Stool as CampStool, LogPile, StickBundle, ChopBlock, ClothesLine, GroundRug, SaddleRack, HandCart, DoorPole, TentSmoke, CookHearth, LoadedWagon, NomadWagon, DousedFire, PostLantern, FarLights, HillWalkers, RitualSite, CynthiaScarf, KnockFire, RottenLog, CampAir, AirLayer} from '../lib3/kitCamp';
import {HALL, StainedWindow, HallBanner, Throne, Dais, HallColumn, WallTorch, ArmourStand, LightShaft, Candelabra, WindowBeam, FloorPool} from '../lib3/kitSanhNgai';
import {BAN_THUOC, HealerTable, GlassVial, Mortar, HerbLine, HangingLamp, Brazier, StrawPallet, IronChest, WallHanging, FloorRug, paintTentCloth, paintHungThings, paintSwaddle, paintCane, paintSling,
  MotherChest, SpellBook, FoldedScarf, ScarfHook, Cobweb, TippedTable, BrokenGlass, RolledPallet, MotherThings, CloakPeg, WorkBench, GearToy, CoilMachine} from '../lib3/kitLeuThayLang';
import {EuropeMap, LatveriaMap} from '../lib3/kitBanDo';
import {AtlanticMap, SHOT16_T} from '../lib3/kitBanDo';
import {WoodDesk, Newspaper, InviteLetter, HeldLetter, NotebookPage, ThoughtBubble} from '../lib3/kitGiayTo';
import {NoticeBoard, GroundShade} from '../lib3/kitCampus';
import {Valise, HeldBook, FlyingBook, BookStand} from '../lib3/kitHanhLy';
import {DiaCau, NenVuTru, SongLan, DuongDi, Ghim, NOI} from '../lib3/kitDiaCau';
import {Blackboard, ChalkWriting, LectureDesk, PendantLamp, WallMap, PictureRail, LectureWindowWall, paintDeskGlobe, paintCollegeFront, paintWindowMaples} from '../lib3/kitGiangDuong';
import {RockShelter, RockMass, SnowRock, SnowDrift, SnowGrave, StandRock, BrokenPine, paintTwigs, paintCliff, Footprints, Blizzard, SnowVeils, PathPair, PathSoldiers, WallShadow, snowCrustTex} from '../lib3/kitNuiTuyet';
import {ColorFlame, FireColumn, GroundCracks, FireBolt, FireCage, FloatRock, FlameWall, HeatRise, AshDrift, Mephisto, MEPH_POSES, SoulFigure, FireBurst, JaggedFire, LavaLake, ObsidianSpire, SmokeBank, FireChain, paintPeaks, paintLava} from '../lib3/kitCoiLua';
import {NU_KHAN_VANG_MAU as SOUL_SPEC_CYNTHIA} from '../mould/nguoi-mau';
const SOUL_H_D1C2 = {cynthia: CAO_MAU.nuKhanVang};
import {CanopyBed, SickbedTable, MullionWindow, paintNightView, ArchDoor, Tapestry, WallShield, IronCandleStand, CarvedChest, HipSword} from '../lib3/kitPhongNgu';

/** THE ASSET STORE (kho asset). assets/catalog.json is the mapping: one entry per reusable piece (an evocative id, what it
 *  looks like, what it suits, how to call it, where the code is). This file holds one PREVIEW per id; the composition
 *  `kho-asset` shows entry i on frame i, and tools/kho.py renders the frames, files them as assets/<nhom>/<id>.png and writes
 *  assets/DANH-MUC.md. A new piece is not finished until it has an entry there and a preview here. */
type V3 = [number, number, number];
type Art = (c: Ctx, W: number, H: number) => void;
export type Prev =
  | {k: '2d'; px: [number, number]; art: Art; plate?: boolean}
  | {k: '3d'; el: () => React.ReactNode; turn?: number; elev?: number; dark?: boolean; grade?: Grade; pad?: number}
  | {k: 'grid'; cells: {label: string; spec: Spec}[]; cols: number; head?: boolean};
export type Entry = {id: string; nhom: string; ten: string; mo_ta: string; hop_voi: string; goi: string; code: string; comp?: string; anh?: boolean};
/** the entries that get a rendered preview, in catalogue order (sets are rendered from their own composition) */
export const KHO_ITEMS = (CATALOG as Entry[]).filter((e) => e.anh !== false && !e.comp);

export const flat = (px: [number, number], art: Art): Prev => ({k: '2d', px, art});
/** far pieces are painted in the 1600 x 900 units of a plate, over a pale sky and a strip of ground */
const plate = (art: (c: Ctx) => void): Prev => ({k: '2d', px: [1600, 900], plate: true, art: (c) => {
  const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#b9d0e8'); g.addColorStop(0.75, '#e6edf1'); c.fillStyle = g; c.fillRect(0, 0, 1600, 900); art(c); c.fillStyle = '#b9c79f'; c.fillRect(0, 780, 1600, 120);
}});
export const d3 = (el: () => React.ReactNode, o: Partial<Extract<Prev, {k: '3d'}>> = {}): Prev => ({k: '3d', el, ...o});
const F = 40;   // the frame effects are shown at
const sCurve = new THREE.CatmullRomCurve3([[-2.2, 7], [-0.6, 2.5], [0.9, -2], [2.0, -7]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
const line = new THREE.LineCurve3(new THREE.Vector3(-7, 0, 0), new THREE.Vector3(7, 0, 0));
const flatTex = (map: THREE.Texture, w: number, h: number) => <mesh position={[0, h / 2 + 0.2, 0]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent /></mesh>;
export const fig = (spec: Spec, h: number) => <Puppet3 height={h} pos={[0, 0, 0]} res={3} spec={spec} />;
const STUDENTS: [string, string, 'sweep' | 'level'][] = [['#7a2f2f', '#3a2a1e', 'sweep'], ['#2f4c75', '#6b4a2a', 'level'], ['#5a4a7a', '#1f1c22', 'level'], ['#8a6a2a', '#4a3020', 'sweep'], ['#3f5a44', '#2a2420', 'level']];

export const PREVIEWS: Record<string, Prev> = {
  // khối 3D từ ảnh Codex, hang Kabuto (src/lib3/khoiTuAnh.tsx)
  'da-vach-hang-cao-hai-khoi-bo-reu': d3(() => <MonHang mon="da-vach-hang-cao-hai-khoi-bo-reu" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'da-vach-hang-thap-rong-vet-nuoc-chay': d3(() => <MonHang mon="da-vach-hang-thap-rong-vet-nuoc-chay" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'cum-nhu-da-ba-mui-nhon-co-reu-treo': d3(() => <MonHang mon="cum-nhu-da-ba-mui-nhon-co-reu-treo" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'tang-da-tron-lon-mot-khoi-bo': d3(() => <MonHang mon="tang-da-tron-lon-mot-khoi-bo" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'ban-da-phang-mot-tam-hai-chan-tho': d3(() => <MonHang mon="ban-da-phang-mot-tam-hai-chan-tho" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'cum-ba-hon-da-tron-chong-len-nhau': d3(() => <MonHang mon="cum-ba-hon-da-tron-chong-len-nhau" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'gia-duoc-go-ba-chan-chen-sat-rong': d3(() => <MonHang mon="gia-duoc-go-ba-chan-chen-sat-rong" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'nen-trang-ngan-tren-da-det-chua-chay': d3(() => <MonHang mon="nen-trang-ngan-tren-da-det-chua-chay" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'lo-dat-nung-nut-ban': d3(() => <MonHang mon="lo-dat-nung-nut-ban" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'binh-gom-co-hep-buoc-day-men-xam-xanh': d3(() => <MonHang mon="binh-gom-co-hep-buoc-day-men-xam-xanh" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'hop-go-mo-nap-ba-cuon-giay': d3(() => <MonHang mon="hop-go-mo-nap-ba-cuon-giay" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'hai-cuon-giay-chong-buoc-day-do': d3(() => <MonHang mon="hai-cuon-giay-chong-buoc-day-do" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  'ke-go-thap-ba-lo-dat-nau-do-xam': d3(() => <MonHang mon="ke-go-thap-ba-lo-dat-nau-do-xam" rotY={-0.5} />, {elev: 0.2, grade: 'dayExterior'}),
  // d1c4: the snowy mountainside and its rock shelter (src/lib3/kitNuiTuyet.tsx)
  'vach-da-phan-lop-mach-nut-tuyet-tren-go': flat([960, 600], paintCliff(4, 2.5, {seed: 3})),
  'go-tuyet-thap-nhieu-mat': d3(() => <><SnowDrift pos={[-1, 0, 0]} w={2.2} d={1.2} h={0.4} seed={3} /><SnowDrift pos={[1.2, 0, 0.3]} w={1.4} d={0.9} h={0.28} seed={6} /></>, {grade: 'snowExterior', elev: 0.3}),
  'mo-tuyet-canh-thong-kho-cam-dau-da-chan': d3(() => <SnowGrave pos={[0, 0, 0]} />, {grade: 'snowExterior', elev: 0.2}),
  'goc-thong-gay-dam-tram-ngon-do-ben-canh': d3(() => <BrokenPine pos={[0, 0, 0]} h={1.45} seed={4} />, {grade: 'snowExterior'}),
  'canh-kho-tro-khoi-tuyet': flat([200, 200], paintTwigs(1)),
  'vet-chan-tren-tuyet-hai-hang': d3(() => <><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow><planeGeometry args={[3, 3]} /><meshLambertMaterial map={snowCrustTex(1)} color="#e8ecf5" /></mesh><Footprints points={[[1.2, 1.3], [0.2, 0.1], [-0.8, -1.3]]} /></>, {elev: 0.7, grade: 'snowExterior'}),
  'bao-tuyet-thoi-xien-hai-lop-man-tuyet-sat-dat': d3(() => <><mesh position={[0, 0.9, -0.5]}><planeGeometry args={[4, 1.8]} /><meshBasicMaterial color="#3a4260" /></mesh><Blizzard f={F} eye={[0, 1, 4.5]} n={150} reach={[3.2, 5.5]} height={1.8} size={0.045} streak={0.09} /><SnowVeils f={F} box={[-2, 2, 0, 0.5]} opacity={0.4} /></>, {dark: true}),
  'linh-ti-hon-ao-do-mu-sat-giao-di-hang-mot-duong-mon': d3(() => <PathSoldiers f={12} path={[[3, 0, 0], [-3, 0, 0]]} n={4} gap={1.1} speed={0} start={5} />),
  'hai-cha-con-ti-hon-leo-duong-mon-xa': d3(() => <PathPair f={12} path={[[1, 0, 0], [-1, 0.2, 0]]} h={1.7} />, {dark: true}),
  'bong-ve-tren-vach-hoa-thanh-bong-khac': d3(() => <><B p={[0, 1.3, -0.1]} s={[3.4, 2.6, 0.2]} c="#b8a0a0" /><WallShadow from={VICTOR_BOY_CLOAK} to={DOOM} mix={0.5} at={[0.3, 0.05, 0.02]} height={1.6} toHeight={2.4} flip /></>, {elev: 0}),
  // ---------------------------------------------------------------- nền xa
  'day-doi-thoai-mat-phang': plate((c) => { paintHills(c, [[0, 520], [240, 430], [470, 500], [760, 390], [1040, 480], [1300, 410], [1600, 500]], 800, {light: '#8fb394', dark: '#7aa083'}); paintHills(c, [[0, 640], [300, 560], [620, 630], [980, 540], [1320, 620], [1600, 570]], 800, {light: '#76a184', dark: '#648f75'}); }),
  'nui-da-voi-dinh-tron': plate((c) => { const t = {light: '#a9bdb2', dark: '#8ea398', cap: '#7fa07c'}; paintKarst(c, 420, 300, 170, 800, t); paintKarst(c, 820, 180, 210, 800, t); paintKarst(c, 1220, 380, 150, 800, t); }),
  'lau-dai-o-xa-thap-mai-non-co-do': plate((c) => paintCastle(c, 440, 790, 3, {stone: '#c3c5cb', shade: '#a9adb8', roof: '#7786a4', roofShade: '#64728f', mark: '#6c7386', flag: '#b4574d'})),
  'chua-thap-nam-tang-mai-cong': plate((c) => paintPagoda(c, 800, 790, 5, {wall: '#d2c2a4', shade: '#b8a98e', roof: '#8d5c4b'})),
  'day-truong-hai-tang-tuong-vang-mai-ngoi-do': plate((c) => paintSchoolBlock(c, 180, 790, 1240, 300, {wall: '#e8cf86', shade: '#cdb571', roof: '#b4583e', roofShade: '#97492f', mark: '#8a7a5c', rail: '#6f8a7e'})),
  'thap-nuoc-nha-ga-cu': plate((c) => paintWaterTower(c, 800, 790, 5.2, {light: '#d8c6a4', dark: '#bba987', tank: '#a98a6c', tankDark: '#8f735a', cap: '#8a5a48'})),
  'nha-nho-o-xa-mai-hai-sac': plate((c) => { paintHouse(c, 420, 790, 420, 300, {light: '#ecdfc4', dark: '#cfc1a2'}, {light: '#b8674b', dark: '#9a543c'}); paintHouse(c, 1000, 790, 300, 220, {light: '#e2e4dc', dark: '#c4c8c0'}, {light: '#7786a4', dark: '#64728f'}); }),
  'may-det-xep-tang': plate((c) => { paintCloud(c, 420, 260, 3.4, {light: '#ffffff', dark: '#dbe4ef'}); paintCloud(c, 1060, 430, 2.4, {light: '#f6f9fc', dark: '#d3deea'}); }),
  // ---------------------------------------------------------------- thiên nhiên
  'cay-tan-tron-ba-sac-xanh': flat([600, 720], (c, W, H) => paintTree(c, W, H)),
  'cay-thong-chia-tang': flat([300, 600], (c, W, H) => paintPine(c, W / 2, H, H, W, {light: '#4f8c5a', dark: '#3c6f49', trunk: '#5a4634'}, 4)),
  'bui-cay-tron-co-the-co-hoa': flat([400, 240], (c, W, H) => paintBush(c, W, H, undefined, '#e88aa0')),
  'khom-co-hai-sac': flat([160, 110], (c, W, H) => paintTuft(c, W, H)),
  'khom-tre-than-dot': flat([420, 640], (c, W, H) => paintBamboo(c, W, H, 2)),
  'cay-cau-than-manh-co-buong-qua': flat([300, 620], paintPalm),
  'cay-chuoi-la-to-ru': flat([400, 420], paintBanana),
  'cay-da-co-thu-re-phu': flat([1120, 920], paintBanyan),
  'cay-bang-tan-tang-la-do-cam': flat([460, 600], (c, W, H) => paintAlmondTree(c, W, H, 3)),
  'cay-phuong-tan-o-hoa-do': flat([900, 640], (c, W, H) => paintFlameTree(c, W, H, 3)),
  'cay-phong-la-do-cam-mua-thu': flat([600, 720], (c, W, H) => paintMaple(c, W, H, ['#b8452c', '#d2622e', '#e58a3a'], undefined, 2)),
  'day-thuong-xuan-leo-goc-tuong': flat([500, 900], (c, W, H) => paintIvy(c, W, H, ['#4a3a2a', '#5a7a3a', '#7a8a3a', '#b0502e', '#4f6a34'])),
  'chau-cay-dat-nung-la-nhon': flat([220, 260], (c, W, H) => paintPotPlant(c, W, H, 2)),
  'dong-rom-vang': flat([300, 300], paintHaystack),
  'tang-da-ba-sac': flat([240, 150], (c, W, H) => paintRock(c, W, H)),
  // ---------------------------------------------------------------- con vật
  'trau-nuoc-co-co-dau-tren-lung': flat([400, 260], paintBuffalo),
  'co-trang-dung': flat([120, 200], paintEgret),
  'ga-mai-nau-hoac-trang': flat([140, 120], (c, W, H) => paintChicken(c, W, H)),
  // ---------------------------------------------------------------- nhà cửa
  'nha-khung-go-mai-ngoi-do-co-ong-khoi': d3(() => <Cottage pos={[0, 0, 0]} />, {turn: 0.5}),
  'nha-tranh-vach-dat-mai-ra': d3(() => <ThatchHouse pos={[0, 0, 0]} />, {turn: 0.45}),
  'cong-lang-gach-co-cau-doi': d3(() => <Gate pos={[0, 0, 0]} />, {turn: -0.25}),
  'leu-vai-chop-nhon': d3(() => <><Tent pos={[-2.4, 0, 0]} s={1.1} lit seed={1} /><Tent pos={[2.4, 0, -0.6]} s={1.0} color="#b99a68" seed={2} /></>),
  'giang-duong-gach-do-thap-dong-ho': d3(() => <LectureHall pos={[0, 0, 0]} hour={17} ivy={['#4a3a2a', '#5a7a3a', '#7a8a3a', '#b0502e', '#4f6a34']} />, {elev: 0.04, pad: 1.08}),
  'ki-tuc-xa-gach-hai-tang': d3(() => <Dormitory pos={[0, 0, 0]} lit={[3, 7]} />, {elev: 0.04, pad: 1.08}),
  'cong-sat-tru-gach-co-den': d3(() => <IronGate pos={[0, 0, 0]} wings={[3, 3]} />, {turn: -0.2}),
  // ---------------------------------------------------------------- đồ ngoài trời
  'gieng-da-tron-mai-do-co-xo': d3(() => <Well pos={[0, 0, 0]} />, {turn: -0.4}),
  'thung-go-vuong-nep-cheo': d3(() => <><Crate pos={[0, 0, 0]} s={0.9} rotY={0.25} /><Crate pos={[0.05, 0.9, -0.05]} s={0.66} rotY={-0.15} /><Crate pos={[1.1, 0, 0.5]} s={0.62} rotY={0.6} /></>, {turn: -0.3}),
  'thung-ruou-go-dai-sat': d3(() => <Barrel pos={[0, 0, 0]} />, {turn: -0.3}),
  'leu-vai-du-muc-chum-coc-vai-va-khau-vien': d3(() => <><NomadTent pos={[-2.5, 0, 0]} s={1.0} lit seed={1} cloth="#c2a271" age={0.8} patches={5} /><NomadTent pos={[2.5, 0, -0.6]} s={0.95} seed={3} cloth="#a68d68" trim={['#5d6a50', '#c9a95a']} pattern={2} patches={3} age={0.95} /></>, {dark: true, elev: 0.08}),
  'thung-go-van-co-van-nep-cheo-dinh': d3(() => <><PlankCrate pos={[0, 0, 0]} size={[0.8, 0.66, 0.66]} rotY={0.3} seed={3} /><PlankCrate pos={[0.05, 0.66, -0.02]} size={[0.56, 0.44, 0.5]} rotY={-0.15} seed={6} base="#8a6a48" /></>, {turn: -0.3}),
  'thung-ruou-nan-cong-dai-sat-dinh-tan': d3(() => <Cask pos={[0, 0, 0]} seed={3} />, {turn: -0.3}),
  'xo-go-nan-dai-sat-quai-thung': d3(() => <Bucket pos={[0, 0, 0]} seed={4} />, {elev: 0.3}),
  'binh-gom-nau-vien-ke-rang-cua': d3(() => <><ClayPot pos={[-0.55, 0, 0]} kind="jar" seed={3} /><ClayPot pos={[0, 0, 0]} kind="jug" seed={4} color="#a86a44" /><ClayPot pos={[0.5, 0, 0.1]} kind="bowl" seed={5} color="#8a5236" /><ClayPot pos={[0.95, 0, 0]} kind="pot" iron seed={6} /></>, {elev: 0.15}),
  'gio-may-dan-vanh-xoan': d3(() => <><Basket pos={[-0.35, 0, 0]} fill="#8a4a3a" seed={2} /><Basket pos={[0.35, 0, 0]} tall seed={4} /></>, {elev: 0.2}),
  'ghe-dau-ba-chan-mat-tron': d3(() => <CampStool pos={[0, 0, 0]} />, {elev: 0.2}),
  'dong-cui-cha-tron-ba-tang': d3(() => <LogPile pos={[0, 0, 0]} seed={3} />, {turn: -0.2}),
  'bo-cui-que-buoc-day': d3(() => <StickBundle pos={[0, 0, 0]} seed={2} />, {turn: -0.3, elev: 0.2}),
  'goc-chat-cui-riu-cam-tren-mat': d3(() => <ChopBlock pos={[0, 0, 0]} />, {elev: 0.2}),
  'day-phoi-quan-ao-chan-soc': d3(() => <ClothesLine a={[-1.5, 0, 0]} b={[1.5, 0, 0]} items={[{k: 'shirt', c: '#c9c0a4'}, {k: 'blanket', c: '#6e3a2e', c2: '#d6b878'}, {k: 'pants', c: '#5a5e6a', c2: '#8a6a4a'}]} />),
  'tham-trai-dat-hoa-van-thoi-tua': d3(() => <GroundRug pos={[0, 0, 0]} w={1.25} d={0.7} />, {elev: 0.5}),
  'yen-ngua-tren-gia-go-day-cuong': d3(() => <SaddleRack pos={[0, 0, 0]} />, {turn: -0.3}),
  'xe-day-hai-banh-cho-bao-tai': d3(() => <HandCart pos={[0, 0, 0]} />, {turn: -0.4}),
  'coc-den-long-treo-bua-chuong-thao-duoc': d3(() => <DoorPole pos={[-0.4, 0, 0]} />, {dark: true}),
  'khoi-mong-boc-tu-lo-thoat-khoi': d3(() => <><B p={[0, 0.05, 0]} s={[0.4, 0.1, 0.4]} c="#3a3634" /><TentSmoke pos={[0, 0.1, 0]} f={60} /></>, {dark: true}),
  'bep-da-than-hong-kieng-noi-gang': d3(() => <CookHearth pos={[0, 0, 0]} f={F} />, {dark: true}),
  'leu-vai-du-muc-dang-ha-va-da-ha-dong-coc': d3(() => <><NomadTent pos={[-2.6, 0, 0]} seed={2} cloth="#b8a07a" trim={['#3f5a6e', '#d6c08a']} pattern={1} down={0.55} /><NomadTent pos={[2.6, 0, 0]} seed={3} cloth="#a68d68" trim={['#5d6a50', '#c9a95a']} pattern={2} down={1} /></>, {dark: true, elev: 0.1}),
  'xe-thung-do-cho-do-tren-noc-banh-lan': d3(() => <LoadedWagon pos={[0, 0, 0]} roll={0.3} />, {dark: true, turn: -0.3}),
  'xe-nha-du-muc-do-mai-cong-diem-banh-nan': d3(() => <NomadWagon pos={[0, 0, 0]} rotY={-0.5} />, {dark: true, turn: -0.2}),
  'vong-da-lam-le-nen-vach-than-dat-nut-sang': d3(() => <RitualSite pos={[0, 0, 0]} state="phep" f={F} glow={0.7} boost={1.4} />, {dark: true, elev: 0.25}),
  'mo-da-chat-coc-go-khan-vang-buoc-dau': d3(() => <><RitualSite pos={[-1.6, 0, 0]} state="mo" f={F} faded={0.1} /><RitualSite pos={[1.6, 0, 0]} state="mo" f={F} faded={1} snow={1} /></>, {elev: 0.2}),
  'khan-vang-cynthia-mac-da-buoc-coc-treo-moc': d3(() => <><B p={[-0.9, 0.5, 0]} s={[0.1, 1.0, 0.08]} c="#6a5038" /><CynthiaScarf pos={[-0.9, 0.98, 0]} on="post" f={F} /><B p={[-0.15, 0.5, 0]} s={[0.1, 1.0, 0.08]} c="#6a5038" /><CynthiaScarf pos={[-0.15, 0.98, 0]} on="post" faded={1} blow={0.9} f={F} /><B p={[0.6, 0.35, 0]} s={[0.3, 0.7, 0.3]} c="#80828c" /><CynthiaScarf pos={[0.6, 0.7, 0]} on="stone" f={F} /><B p={[1.2, 1.0, -0.05]} s={[0.3, 0.05, 0.05]} c="#5a4430" /><CynthiaScarf pos={[1.2, 0.98, 0]} on="hook" f={F} faded={0.6} /></>),
  'lua-trai-kieng-nghieng-noi-van-lan': d3(() => <KnockFire pos={[0, 0, 0]} f={F} knock={5} />, {dark: true}),
  'khong-khi-trai-bui-vang-dom-dom-tan-lua': d3(() => <><B p={[0, 1.5, -8]} s={[12, 3, 0.2]} c="#4a5a5c" /><CampAir f={F} mode="dusk" k={0.5} sparks={[[0, 0.3, -4]]} /></>, {dark: true}),
  'khuc-go-muc-nam-reu-phu': d3(() => <RottenLog pos={[0, 0, 0]} />, {turn: -0.3, elev: 0.2}),
  'dong-lua-da-dap-than-hong-khoi': d3(() => <DousedFire pos={[0, 0, 0]} f={F} />, {dark: true}),
  'cot-den-long-tat-ban-ngay': d3(() => <><PostLantern pos={[-0.5, 0, 0]} /><PostLantern pos={[0.6, 0, 0]} lit h={2.1} /></>, {dark: true}),
  'doan-duoc-den-long-xa-di-theo-duong': d3(() => <><B p={[0, 0.5, -0.5]} s={[8, 1, 0.2]} c="#2a3040" /><FarLights f={F} path={[[-3.5, 2.4, 0], [0, 1.6, 0], [3.5, 0.9, 0]]} n={7} gap={1} speed={0} start={6.5} size={0.1} /></>, {dark: true}),
  'nguoi-nho-di-tren-duong-moi-doi-xa': d3(() => <><B p={[0, 0.5, -0.3]} s={[6, 1, 0.2]} c="#6e8577" /><HillWalkers f={0} path={[[2.6, 0, 0], [-2.6, 0, 0]]} n={5} gap={1.1} /></>, {elev: 0.05}),
  'bao-tai-buoc-mieng': d3(() => <><Sack pos={[0, 0, 0]} /><Sack pos={[0.8, 0, -0.3]} s={0.85} /></>, {turn: -0.2}),
  'chum-sanh-dat-nung': d3(() => <><Jar pos={[0, 0, 0]} lid /><Jar pos={[0.8, 0, 0.3]} s={0.8} /></>, {turn: -0.2}),
  'xe-thung-lu-hanh-do-mai-xanh-cua-so-sang': d3(() => <Wagon pos={[0, 0, 0]} />, {turn: -0.45}),
  'den-long-treo-coc-go': d3(() => <Lantern pos={[0, 0, 0]} />, {dark: true}),
  'duoc-cam-tay-lua-chay-quang-cam': d3(() => <><HandTorch pos={[-0.25, 0.3, 0]} f={F} /><HandTorch pos={[0.25, 0.3, 0]} f={F + 9} tilt={-0.2} seed={4} /></>, {dark: true}),
  'giao-cam-tay-luoi-sat-tua-do': d3(() => <><HeldPole pos={[-0.25, 1.0, 0]} below={1.0} above={1.3} /><HeldPole pos={[0.25, 1.0, 0]} below={1.0} above={0.6} tip="staff" /></>),
  'bat-go-rong-nghieng-cho-thay-long': d3(() => <WoodBowl pos={[0, 0.12, 0]} s={2} />),
  'den-long-xach-tay-kinh-sang-am': d3(() => <><HandLantern pos={[-0.2, 0.5, 0]} f={F} /><HandLantern pos={[0.2, 0.5, 0]} lit={false} /></>, {dark: true}),
  'khuc-go-ngoi-vat-chan-do': d3(() => <LogSeat pos={[0, 0, 0]} />, {turn: -0.4}),
  'dong-cui-tron-xep-thap': flat([420, 260], paintWood),
  'hang-rao-tre-thap-nan-thua': d3(() => <BambooFence from={-4} to={4} z={0} />, {turn: -0.3}),
  'hang-rao-go-coc-va-thanh-ngang': d3(() => <Fence curve={line} off={0} from={0.1} to={0.9} />, {turn: -0.35}),
  'duong-dat-co-vet-banh-xe': d3(() => <Road curve={sCurve} />, {elev: 0.5, pad: 1.0}),
  'ghe-da-san-truong': d3(() => <StoneBench pos={[0, 0, 0]} />, {turn: -0.4}),
  'cot-den-gang-long-den-bon-mat': d3(() => <><CampusLamp pos={[-0.9, 0, 0]} /><CampusLamp pos={[0.9, 0, 0]} lit /></>, {dark: true}),
  'tuong-dong-nguoi-sang-lap-tren-be-da': d3(() => <FounderStatue pos={[0, 0, 0]} name="kho-founder" />),
  'gia-xe-dap-co-xe-dung': d3(() => <BikeRack pos={[0, 0, 0]} />),
  'loi-lat-da-co-via': d3(() => <PavedPath a={[0, 5]} b={[0, -5]} w={3} color="#c9b999" seed={2} y={0.01} />, {elev: 0.55, turn: -0.5, pad: 1.0}),
  'la-rung-rai-tren-dat': d3(() => <FallenLeaves pos={[0, 0, 0]} area={[6, 4]} n={70} seed={1} />, {elev: 0.7, pad: 1.0}),
  'quang-ganh-hai-thung': d3(() => <CarryBaskets pos={[0, 0, 0]} />, {turn: -0.3}),
  'bien-chu-phang-tren-mat-tuong': d3(() => <><B p={[0, 1.2, 0]} s={[3.2, 2.4, 0.2]} c="#e2d3b0" /><Label text="GA XÉP" p={[0, 1.5, 0.11]} w={1.8} h={0.5} /></>),
  // ---------------------------------------------------------------- nhà ga, xe lửa
  'duong-ray-ta-vet-go-nen-da': d3(() => <Track curve={line} seed={5} />, {turn: -0.6, elev: 0.3}),
  'dau-may-diesel-xanh-kem-soc-do': d3(() => <><Track curve={line} seed={5} /><Locomotive pos={[0, 0.2, 0]} L={5.6} smoke={false} /></>, {turn: -0.25}),
  'toa-khach-kem-xanh-duong-sat-viet-nam': d3(() => <><Track curve={line} seed={8} /><Carriage pos={[0, 0.2, 0]} open={1} num="3" /></>, {turn: -0.25}),
  'san-ga-be-tong-mep-da': d3(() => <Platform x0={-6} x1={6} edge={-1.6} back={1.6} h={0.9} />, {turn: 2.7, elev: 0.3}),
  'nha-cho-san-ga-mai-ton-cot-gang': d3(() => <StationShelter pos={[-4.5, 0, 0]} w={9} d={4.6} h={3.0} office={0.95} board={[0.05, -1.3, 1.6]} bell={[0.6, -1.75]} />, {turn: Math.PI - 0.35}),
  'ghe-go-san-ga': d3(() => <Bench pos={[0, 0, 0]} />, {turn: -0.4}),
  'den-san-ga-cot-gang-tay-cong': d3(() => <><StationLamp pos={[-0.8, 0, 0]} /><StationLamp pos={[0.8, 0, 0]} lit /></>, {dark: true}),
  'cot-tin-hieu-canh-do': d3(() => <><Semaphore pos={[-1, 0, 0]} /><Semaphore pos={[1.2, 0, 0]} clear /></>),
  'hang-cot-dien-bao-day-vong': d3(() => <PoleLine feet={[[-9, 0, 0], [0, 0, 0], [9, 0, 0]]} h={6} />, {turn: -0.3}),
  // ---------------------------------------------------------------- đồ trong nhà: lớp học
  'tuong-cua-so-song-sat-canh-chop': d3(() => <WindowWall length={6.4} height={3.6} sill={1.0} head={2.7} windows={[[0.9, 2.5], [3.9, 5.5]]} wall="#e9dfc4" dado="#8fb0a0" />, {turn: -Math.PI / 2 + 0.25}),
  'tu-sach-go-canh-kinh': d3(() => <Cabinet pos={[0, 0, 0]} />, {turn: -0.35}),
  'ban-giao-vien-co-lo-hoa-chong-vo': d3(() => <TeacherDesk pos={[0, 0, 0]} />, {turn: -0.35}),
  'ban-hoc-sinh-doi-co-ghe-bang': d3(() => <Desk pos={[0, 0, 0]} seed={4} />, {turn: 0.4, elev: 0.25}),
  'quat-tran-ba-canh-mau-kem': d3(() => <CeilingFan pos={[0, 3.4, 0]} turn={0.3} />, {elev: -0.25}),
  'cap-sach-deo-lung': flat([200, 240], (c, W, H) => paintSchoolbag(c, W, H)),
  'lo-hoa-nhieu-mau': flat([260, 300], (c, W, H) => paintBouquet(c, W, H)),
  'choi-rom-dung': flat([120, 520], paintBroom),
  // ---------------------------------------------------------------- đồ trong nhà: phòng thí nghiệm
  'co-may-vong-sat-quan-day-dong': d3(() => <Machine pos={[0, 0, 0]} lamps={3} />, {turn: -0.2}),
  'ban-lam-viec-den-chup-xanh': d3(() => <LabDesk pos={[0, 0, 0]} lampOn />, {turn: Math.PI - 0.4, elev: 0.25}),
  'ghe-dau-ba-chan': d3(() => <Stool pos={[0, 0, 0]} />, {turn: -0.3, elev: 0.25}),
  'giuong-sat-don-chan-xam': d3(() => <IronBed pos={[0, 0, 0]} />, {turn: -0.6, elev: 0.25}),
  'dong-ho-qua-lac-treo-tuong': d3(() => <PendulumClock pos={[0, 0.2, 0]} swing={0.2} />, {turn: -0.3}),
  'ke-sach-treo-tuong-lech': d3(() => <CrookedShelf pos={[0, 1, 0]} w={1.2} tilt={0.04} seed={3} />, {turn: -0.2}),
  'ke-do-thuy-tinh-thi-nghiem': d3(() => <GlassShelf pos={[0, 1, 0]} w={1.0} />, {turn: -0.2}),
  'cua-go-mo-ra-hanh-lang': d3(() => <LabDoor w={1.0} h={2.15} open={-1.2} hinge="right" corridor={1.7} />, {turn: -0.15}),
  'tham-cu-son': d3(() => <Rug pos={[0, 0, 0]} w={2.3} d={1.5} />, {elev: 0.6, turn: -0.3}),
  'day-cap-cao-su-tren-san': d3(() => <Cable pts={[[-1.6, 0.25, 0], [-1.3, 0.03, 0.3], [-0.6, 0.03, 1.1], [0.4, 0.03, 0.6], [1.2, 0.03, 1.3], [1.9, 0.03, 0.9]]} />, {elev: 0.5}),
  'ban-ve-may-nen-xanh': d3(() => <Sheet map={tex('kho-plan-blue', 640, 460, paintPlan('blue', 11))} x={0} y={0.6} w={0.9} h={0.65} rot={-2} />),
  'ban-ve-may-but-chi-giay-kem': d3(() => <Sheet map={tex('kho-plan-cream', 600, 430, paintPlan('cream', 18))} x={0} y={0.6} w={0.9} h={0.65} rot={2} />),
  'to-tinh-toan-co-mot-dong-sai': d3(() => <Sheet map={calcSheetTex()} x={0} y={0.6} w={0.62} h={0.81} rot={-2} pins={4} />),
  'bang-den-day-phan': d3(() => flatTex(boardTex(), 1.4, 1.0)),
  'anh-chan-dung-nguoi-me-mau-nau': d3(() => flatTex(portraitTex(), 0.4, 0.5)),
  'ban-ve-trai-tren-mat-ban': d3(() => flatTex(deskPlanTex(), 0.72, 0.52)),
  'co-may-vong-sat-rach-dinh-cuon-dong-dut': d3(() => <WreckedMachine pos={[0, 0, 0]} />, {turn: -0.2}),
  'ban-go-dai-lat-nghieng-ngan-keo-roi': d3(() => <DeskOverturned pos={[0, 0, 0]} />, {turn: -0.3, elev: 0.25}),
  'den-ban-chup-xanh-do-nam-san': d3(() => <FallenLamp pos={[0, 0, 0]} />, {turn: -0.3, elev: 0.35}),
  'giay-va-sach-vuong-vai-tren-san': d3(() => <SpiltPapers pos={[0, 0, 0]} area={[2.6, 1.9]} n={18} books={5} seed={4} />, {elev: 0.6}),
  'dong-sach-do-hai-bac': d3(() => <BookPile pos={[0, 0, 0]} rotY={0.1} />, {elev: 0.2}),
  'khung-anh-me-kinh-nut-dung-nghieng': d3(() => <><BookPile pos={[0, 0, 0]} rotY={0.1} /><PhotoCracked pos={[0, BOOKPILE.step, 0]} /></>, {elev: 0.1}),
  'cua-so-vom-vo-kinh-rem-rach': d3(() => <BrokenArchWindow x0={-0.6} x1={0.6} sill={1.0} spring={2.2} />),
  'ban-ve-chay-treo-mot-ghim': d3(() => <HangingSheet map={tex('kho-hang-burnt', 600, 430, paintBurnt(paintPlan('cream', 5), 3, 'bottom', 0.4))} pin={[0, 1.2]} w={0.6} h={0.45} />),
  'ban-ve-chay-xem-con-ghim-phang': d3(() => <BurntSheet map={tex('kho-flat-burnt', 600, 430, paintBurnt(paintPlan('blue', 5), 3, 'left', 0.35))} x={0} y={0.6} w={0.9} h={0.65} pins={[true, false]} />),
  'vet-chay-xem-toa-hinh-quat-tren-san': d3(() => <FloorDecal pos={[0, 0, 0]} size={[5, 4.5]} map={scorchTex()} />, {elev: 0.7, pad: 1.0}),
  'than-hong-am-i-tren-san': d3(() => <EmberBed pts={[[-0.3, 0.02, 0], [0.1, 0.02, 0.2], [0.35, 0.02, -0.1], [-0.05, 0.02, -0.25], [0.5, 0.02, 0.25], [-0.5, 0.02, 0.3]]} />, {dark: true, elev: 0.5}),
  // ---------------------------------------------------------------- hiệu ứng
  'dong-lua-trai-co-tan-lua': d3(() => <Fire pos={[0, 0, 0]} f={F} />, {dark: true}),
  'dom-dom-troi-cham': d3(() => <Fireflies f={F} />, {dark: true}),
  'la-bay-theo-gio': d3(() => <FlyingLeaves f={F} box={[-3, 3, 3.2, -1, 1]} n={26} size={0.2} />),
  'bui-nang-vang-lo-lung': d3(() => <Motes f={F} box={[-4.5, 4.5, 0.2, 4.6, -1.5, 1.5]} n={70} color="#ffe9b0" size={0.03} glow={2.2} />, {dark: true}),
  'thieu-than-quanh-den': d3(() => <><CampusLamp pos={[0, 0, 0]} lit /><Motes f={F} box={[-0.6, 0.6, 2.4, 3.4, -0.3, 0.3]} n={9} color="#fff3c8" size={0.05} drift={2} glow={2.4} /></>, {dark: true}),
  'khoi-dau-may-bay-len': d3(() => <LocoSmoke pos={[0, 0, 0]} f={70} n={12} life={96} rise={1.9} wind={1.1} size={0.46} />),
  'cum-khoi-hoi-nuoc-ve-san': flat([300, 420], (c, W, H) => paintSmoke(c, W, H)),
  'quang-sang-mem': d3(() => <><Halo pos={[-1.6, 1.4, 0]} r={1.3} /><Halo pos={[1.6, 1.4, 0]} r={1.3} color="#9fd8ff" strength={0.7} /></>, {dark: true}),
  'dau-tich-xanh-va-vong-do-bat-tren-to-giay': d3(() => <><Sheet map={calcSheetTex()} x={0} y={0.6} w={0.62} h={0.81} rot={-2} pins={4} /><SheetMarks f={60} x={0} y={0.6} w={0.62} h={0.81} rot={-2} z={0.012} lines={CALC_LINES.y} tickX={CALC_LINES.tickX} ticks={[0, 7, 14, 21, null, null]} ring={{line: 4, at: 40, x0: 0.09, x1: 0.84}} /></>),
  'bong-do-mem-cua-nguoi-ngoai-khung': d3(() => <><mesh position={[0, 0.5, 0]}><planeGeometry args={[1.4, 1.0]} /><meshBasicMaterial color="#efe5c9" /></mesh><SoftShadow kind="head" pos={[-0.3, 0.55, 0.01]} size={[0.6, 0.6]} opacity={0.4} /><SoftShadow kind="blob" pos={[0.38, 0.45, 0.01]} size={[0.5, 0.42]} opacity={0.5} /></>),
  'cua-anh-sang-xoay-trong-vong': d3(() => <><Portal pos={[-1.45, 1.3, 0]} r={1.2} f={F} inside={beyondTex()}><Puppet3 height={1.45} pos={[0, -0.74, 0.006]} spec={MOTHER} lit={false} tint="#cfe6ff" order={6} cast={false} /></Portal><Portal pos={[1.45, 1.3, 0]} r={1.2} f={F} heat={1} inside={beyondTex()} /></>, {dark: true, pad: 1.0}),
  'set-bo-quanh-vong-may': d3(() => <><mesh position={[0, 1.3, 0]}><ringGeometry args={[1.0, 1.2, 40]} /><meshBasicMaterial color="#3a4658" /></mesh><RingLightning pos={[0, 1.3, 0.02]} r={1.2} f={7} n={4} on={1} /></>, {dark: true, pad: 1.0}),
  'bong-den-bat-sang-quang-nhieu-canh': d3(() => <><B p={[-0.5, 0.4, 0]} s={[0.1, 0.8, 0.1]} c="#d8d2c4" /><B p={[0.5, 0.4, 0]} s={[0.1, 0.8, 0.1]} c="#d8d2c4" /><BulbHalo pos={[-0.5, 0.9, 0.06]} r={0.2} f={3} seed={1} /><BulbHalo pos={[0.5, 0.9, 0.06]} r={0.2} f={8} color="#ff9a4a" seed={2} /></>, {dark: true}),
  'tia-dien-nhay-giua-hai-diem': d3(() => <><B p={[-0.5, 0.5, 0]} s={[0.12, 1, 0.12]} c="#d8d2c4" /><B p={[0.5, 0.5, 0]} s={[0.12, 1, 0.12]} c="#d8d2c4" /><Arc a={[-0.5, 1.02, 0.07]} b={[0.5, 1.02, 0.07]} f={3} on={1} /></>, {dark: true}),
  'giay-bay-bi-hut-ve-mot-diem': d3(() => <><FlyingPapers f={34} from={[-2.5, -1.5, 0.6, 1.0, -0.3, 0.3]} to={[2, 1.6, 0]} life={24} /><Halo pos={[2, 1.6, 0]} r={0.7} color="#8fe9ff" /></>, {dark: true}),
  'vu-no-phut-ra-tu-o-cua': d3(() => <><B p={[0, 2, -0.2]} s={[7, 5, 0.2]} c="#8a4a3a" /><Explosion pos={[0, 2.4, 0]} f={8} at={0} s={1.2} seed={3} star={3.4} clouds={14} /></>, {dark: true}),
  'khoi-troi-lo-lung-trong-phong': d3(() => <SmokeDrift f={F} box={[-3, 3, 0.4, 2.4, -0.5, 0.5]} opacity={0.5} />, {dark: true}),
  'tan-lua-bay-len-roi-tat': d3(() => <Embers f={F} box={[-1, 1, 0, 2.4, -0.3, 0.3]} n={30} />, {dark: true}),
  'tay-tho-ren-cam-bua-go-xuong': d3(() => <group position={[-ELBOW[0] - 0.35, -ELBOW[1] + 1.0, -ELBOW[2]]}><HammerArm a={0.25} /></group>),
  'cham-sang-nho-bay-quanh-vat-nong': d3(() => <HotSpecks f={F} box={[-0.5, 0.5, 0.3, 1.5, -0.1, 0.1]} k={1} />, {dark: true}),
  'hoi-nuoc-boc-tu-mep-sat-nong': d3(() => <Steam f={F} start={0} from={[[-0.3, 0.7, 0], [0.3, 0.7, 0], [-0.15, 1.0, 0], [0.15, 1.0, 0]]} />, {dark: true}),
  'tia-lua-toe-doc-vien-khi-bua-go': d3(() => <RimSparks f={4} at={0} pos={[0, 1.0, 0]} />, {dark: true}),
  'chum-tia-lua-ban-ra-hai-ben': d3(() => <SparkBurst f={5} at={0} pos={[0, 1.1, 0]} n={40} />, {dark: true}),
  'hat-sang-xanh-troi-mot-huong': d3(() => <DriftSpecks f={F} box={[-1.5, 1.5, 0.3, 1.8, -0.4, 0.4]} n={40} size={0.012} seed={4} />, {dark: true}),
  // ---------------------------------------------------------------- nhân vật
  'lo-ren-da-chup-khoi-bac-than-hong-lua': d3(() => <><B p={[0, 2.4, -0.15]} s={[3.6, 4.8, 0.3]} c="#5e564c" /><ForgeHearth pos={[0, 0, 0]} f={F} ceiling={4.6} light={false} /></>, {dark: true, elev: 0.08}),
  'cua-so-vom-kinh-mau-o-thoi-xanh-vang-hoa-hong': d3(() => <><B p={[0, 1.6, -0.5]} s={[2.4, 3.6, 0.05]} c="#3c4246" /><StainedWindow id="kho" w={1.3} h={2.95} look={HALL.doom} depth={0.1} /></>, {dark: true, elev: 0.05}),
  'co-treo-doc-xanh-vien-vang-huy-hieu-vong': d3(() => <><B p={[0, 1.7, -0.03]} s={[1.6, 3.6, 0.04]} c="#4c5356" /><HallBanner id="kho" pos={[0, 3.3, 0]} w={0.9} h={3.0} look={HALL.doom} /></>, {elev: 0.05}),
  'ngai-da-lung-cao-dinh-nhon-nem-xanh-vien-vang': d3(() => <Throne pos={[0, 0, 0]} look={HALL.doom} />, {turn: 0.35, elev: 0.15}),
  'be-da-ba-bac-tham-xanh-vien-vang': d3(() => <group position={[0, 0, 10.5]}><Dais x={0} look={HALL.doom} /></group>, {turn: 0.4, elev: 0.3}),
  'cot-da-tron-chan-vuong-dau-dem': d3(() => <HallColumn pos={[0, 0, 0]} h={6.6} seed={1} band={HALL.doom.gold} />, {elev: 0.1}),
  'duoc-tuong-gia-sat-lua-chay': d3(() => <><B p={[0, 0.2, -0.03]} s={[0.9, 1.4, 0.04]} c="#4c5356" /><WallTorch pos={[0, 0, 0]} f={F} /></>, {dark: true, elev: 0.1}),
  'bo-giap-trang-tri-cam-kich-tren-be-da': d3(() => <ArmourStand pos={[0, 0, 0]} />, {turn: 0.25, elev: 0.1, dark: true}),
  'chan-nen-vang-cao-ba-ngon-nen-trang': d3(() => <Candelabra pos={[0, 0, 0]} f={F} />, {dark: true, elev: 0.1}),
  'vet-sang-cua-kinh-mau-qua-khong-khi-va-tren-san': d3(() => <><B p={[0, 0.02, -1.5]} s={[3.5, 0.04, 5]} c="#2e3634" /><B p={[0, 2.6, -4.0]} s={[3.5, 5.2, 0.1]} c="#2a302e" /><group position={[0, 2.3, -3.94]}><StainedWindow id="kho-pool" w={1.6} h={2.6} look={HALL.doom} depth={0.01} /></group><WindowBeam x={0} sill={2.3} top={4.6} w={1.5} wallZ={-3.95} dir={[-0.072, -0.623, 0.779]} look={HALL.doom} strength={0.2} f={F} /><FloorPool id="kho" x={0} sill={2.3} top={4.6} w={1.6} wallZ={-3.95} dir={[-0.072, -0.623, 0.779]} look={HALL.doom} strength={0.6} /></>, {dark: true, elev: 0.25}),
  'luong-sang-tu-tren-cao-co-bui': d3(() => <><B p={[0, 0.05, 0]} s={[2.4, 0.1, 2.4]} c="#3a3e42" /><LightShaft top={[0, 3.2, 0]} bottom={[0, 0.1, 0]} r={0.8} strength={0.3} f={F} /></>, {dark: true, elev: 0.1}),
  'than-dan-ao-choang-dai-nhin-tu-sau-lung': d3(() => <>{HALL_SUBJECTS.map((p, i) => <Puppet3 key={i} height={p.h} pos={[(i - 2.5) * 0.85, 0, 0]} res={3} spec={p.spec} />)}</>),
  'ong-be-da-tren-gia-go': d3(() => <Bellows pos={[0, 0, 0]} />, {turn: 0.5, elev: 0.25}),
  'gia-go-treo-kim-bua-tren-tuong': d3(() => <><B p={[0, 0.2, -0.03]} s={[1.5, 1.4, 0.04]} c="#7d746a" /><ToolRack pos={[0, 0.6, 0]} w={1.0} /></>, {elev: 0.05}),
  'tranh-vai-thangka-mandala-xanh-vien-do': d3(() => <><B p={[0, 0, -0.03]} s={[1.0, 1.4, 0.04]} c="#7d746a" /><Thangka pos={[0, 0, 0]} /></>, {elev: 0.05}),
  'ke-da-ba-den-bo-dong': d3(() => <><B p={[0, 0, -0.03]} s={[1.2, 0.8, 0.04]} c="#5e564c" /><ButterLamps pos={[0, 0, 0]} f={F} /></>, {dark: true, elev: 0.15}),
  'thung-go-nuoc-toi-sat-dai-sat': d3(() => <QuenchTub pos={[0, 0, 0]} />, {elev: 0.35}),
  'bao-than-cui-mieng-mo': d3(() => <CoalSack pos={[0, 0, 0]} />, {elev: 0.3}),
  'de-sat-tren-goc-cay': d3(() => <Anvil pos={[0, 0, 0]} tongs hammer />, {turn: 0.35, elev: 0.25}),
  'mat-na-doom-roi-nung-do-nguoi-dan': d3(() => <><Anvil pos={[0, 0, 0]} tongs glow={0.6} /><LooseMask pos={[0.03, ANVIL.top, 0.06]} heat={1} f={F} /></>, {dark: true, elev: 0.1}),
  'ban-thap-tho-ren-co-kim-bua': d3(() => <LowBench pos={[0, 0, 0]} />, {turn: 0.3, elev: 0.35}),
  'sinh-vien-phu-gile-nhieu-mau': d3(() => <>{STUDENTS.map(([v, h, k], i) => <Puppet3 key={i} height={HEIGHT.student} pos={[(i - 2) * 1.0, 0, 0]} res={3} spec={student(v, h, k)} />)}</>),
  'truong-ga-gile-xanh-tham': d3(() => fig(MASTER, 1.7)),
  'cau-be-ao-xanh-nhat-quan-nau': d3(() => fig(BOY, 1.15)),
  // ---------------------------------------------------------------- phố New York 1880 (đoạn tesla, src/lib3/kitNyStreet.tsx)
  'nha-pho-gach-da-nhieu-tang-cua-hang-mai-hien-soc': d3(() => <><Townhouse pos={[-4.2, 0, 0]} w={8} h={14.4} color="#8a4434" sign="HARDWARE" awning={['#b8463a', '#efe4cc']} seed={3} end={-1} tank /><Townhouse pos={[4.2, 0, 0]} w={8} h={16} color="#c9b894" kind="stone" sign="OYSTERS" awning={['#3f6a5a', '#efe4cc']} paint="#4a2e2a" board="#3a1e1a" seed={5} /></>, {turn: 0.3, elev: 0.04}),
  'nha-may-dien-gach-do-cua-vom-sat-ong-khoi': d3(() => <PowerStation pos={[-7, 0, 0]} f={60} />, {turn: 0.45, elev: 0.04}),
  'nha-da-xam-dau-hoi-cua-go-hai-canh-bac-da': d3(() => <StoneOffice pos={[0, 0, 0]} sign="WESTINGHOUSE ELECTRIC CO." />, {turn: 0.35, elev: 0.04}),
  'cau-dao-lon-bang-go-luoi-dong-tay-gat': d3(() => <><B p={[0, 0.75, -0.06]} s={[2.0, 1.5, 0.1]} c="#7e3a2e" /><KnifeSwitch pos={[-0.45, 0.75, 0]} pull={0} /><KnifeSwitch pos={[0.45, 0.75, 0]} pull={1} /></>, {turn: 0.35}),
  'cot-den-dien-gang-bong-tron-vung-sang': d3(() => <><ElectricLamp pos={[-1.2, 0, 0]} level={0} light={false} /><ElectricLamp pos={[1.2, 0, 0]} arm={-1} level={1} f={F} light={false} /></>, {dark: true}),
  'den-khi-gang-lua-vang-xanh-yeu': d3(() => <><CampusLamp pos={[0, 0, 0]} h={3.4} /><GasGlow pos={[0, 0, 0]} h={3.4} /></>, {dark: true}),
  'cot-dien-go-nhieu-xa-day-chang-chit': d3(() => <WirePoles feet={[[-6, 0, 0], [0, 0, -1], [6, 0, 0]]} h={9} />, {turn: 0.25}),
  'mat-duong-da-hoc-xam': d3(() => <CobbleRoad pos={[0, 0, 0]} size={[4, 4]} />, {elev: 0.5}),
  'via-he-lat-da-phien-bo-via': d3(() => <><CobbleRoad pos={[1.2, -0.12, 0]} size={[2.6, 4]} /><Sidewalk x={[-2.4, -0.1]} z={[2, -2]} kerb={['x1']} /></>, {elev: 0.4, turn: 0.3}),
  'muong-dao-giua-pho-dong-dat-van-xeng-cuoc-co-do': d3(() => <><CobbleRoad pos={[1.8, -0.12, -5]} size={[2.4, 12]} /><Trench x={0} z={[1, -11]} heap={-1} heapAt={-1.4} planks={[-8]} tools={[-2.5, -4.5]} road={-0.12} /></>, {turn: 0.55, elev: 0.3}),
  'dat-vang-tu-muong-roi-xuong-dong': d3(() => <>{[[4, 1], [8, 2], [11, 3]].map(([f, sd]) => <DirtThrow key={sd} f={f} from={[0.8, 0, 0]} to={{x: [-1.2, -0.8], z: [-0.4, 0.4], y: 0.3}} every={40} seed={sd} />)}<B p={[-1, 0.15, 0]} s={[1.2, 0.3, 1.2]} c="#7a5a3e" /></>),
  'thap-cau-treo-da-hai-vom-nhon-day-cap': plate((c) => paintBridgeTower(c, 800, 790, 2.2, {stone: '#b2ab98', shade: '#a19a88', cable: '#7a7466'})),
  'edison-toc-bac-gile-xam-than': d3(() => fig(EDISON, TH.edison)),
  'tesla-cao-toc-den-vuot-ba-bo-ao': d3(() => <>{[TESLA_LAB, TESLA_WORN, TESLA_FAIR].map((s, i) => <Puppet3 key={i} height={TH.tesla} pos={[(i - 1) * 1.1, 0, 0]} res={3} spec={s} />)}</>),
  'westinghouse-rau-quai-non-ao-choang-nau': d3(() => fig(WESTINGHOUSE, TH.westinghouse)),
  'nguoi-phu-the-ki-19-ao-choang-hoac-gile': d3(() => <>{[extra('#3a3238', '#2a2228'), extra('#5a3a3a', '#6b4a2a', 'sweep'), extra('#6a5a46', '#2a2420', 'level', true)].map((s, i) => <Puppet3 key={i} height={TH.extra} pos={[(i - 1) * 1.0, 0, 0]} res={3} spec={s} />)}</>),
  'ban-do-dong-bac-my-giay-kem-cham-new-york': d3(() => <mesh position={[0, 0.6, 0]}><planeGeometry args={[1.55, 1.0]} /><meshBasicMaterial map={mapNETex()} /></mesh>),
  'duong-song-sin-xanh-tu-ve-dan-theo-lo-trinh': d3(() => <>{[0.45, 1].map((p, i) => <group key={i} position={[0, 0.35 + i * 0.55, 0]}><mesh position={[0, 0, -0.002]}><planeGeometry args={[1.5, 0.5]} /><meshBasicMaterial color="#efe6cf" /></mesh><SineWave pts={[[-0.65, -0.1], [-0.25, 0.12], [0.2, -0.08], [0.65, 0.1]]} progress={p} amp={0.025} wave={0.09} width={0.014} /></group>)}</>),
  'ban-do-ghim-vong-do-song-xanh-cham-vang-bat': d3(() => <MapInsert f={F + 30} x={0} y={0.6} w={1.4} h={0.9} z={0} />),
  // ---------------------------------------------------------------- hội chợ Chicago 1893 và góc tường trong nhà (đoạn tesla, src/lib3/kitChicagoFair.tsx, kitHomeCorner.tsx)
  'lau-dai-trang-hang-cot-hai-tang-den-vien': d3(() => <Palace pos={[0, 0, 0]} L={70} />, {turn: 0.5, elev: 0.06}),
  'toa-nha-vom-vang-tam-suon-tren-tang-tron': d3(() => <DomeHall pos={[0, 0, 0]} />, {turn: 0.35, elev: 0.06}),
  'day-bong-den-ngan-bong-bat-theo-lan-song': d3(() => <><Palace pos={[0, 0, 0]} L={70} warm={1} glow={1} /><BulbField bulbs={palaceBulbs([0, 0, 0], 0, 70)} power={FAIR_LIT} f={F} /></>, {dark: true, elev: 0.06}),
  'chum-den-pha-hinh-non-quet-len-troi': d3(() => <><B p={[0, 0.5, 0]} s={[4, 1, 4]} c="#8a8a96" /><Searchlight pos={[0, 1, 0]} tilt={0.35} lean={0} len={40} spread={3} /></>, {dark: true}),
  'mat-ho-toi-phan-chieu-lan-tan-bo-da': d3(() => <><Lake x={[-6, 6]} z={[6, -14]} f={F} /><Mirror level={-0.55}><FairLamp pos={[0, 0, -10]} level={1} f={F} /></Mirror><FairLamp pos={[0, 0, -10]} level={1} f={F} /><BulbField bulbs={bulbLine('cornice', [[-5, 3, -12], [5, 3, -12]], 0.5)} power={FAIR_LIT} f={F} water={-0.55} /></>, {dark: true, elev: 0.25}),
  'lan-can-da-con-tien-be-vuong': d3(() => <Balustrade x={[-3, 3]} z={0} posts={[-2.7, 2.7]} />, {turn: 0.3, elev: 0.1}),
  'cot-den-gang-ba-qua-cau-hoi-cho': d3(() => <><FairLamp pos={[-0.8, 0, 0]} level={0} /><FairLamp pos={[0.8, 0, 0]} level={1} f={F} /></>, {dark: true}),
  'tuong-vang-nu-than-gio-tay-cam-qua-cau': flat([300, 920], paintGoldStatue(true)),
  'nguoi-di-dao-nho-o-xa-ao-toi': flat([360, 120], paintWalkers(3)),
  'tuong-son-vang-kem-loang-nhe-len-chan-tuong': d3(() => <PaintedWall w={3} h={2} />, {elev: 0.05}),
  'lich-treo-tuong-dau-do-thang-11': d3(() => <><B p={[0, 0.4, -0.02]} s={[0.6, 0.8, 0.02]} c="#ead9a6" /><WallCalendar pos={[0, 0.1, 0]} w={0.36} /></>, {elev: 0.05}),
  'o-cam-doi-trang-hai-lo-tron-phich-den-day': d3(() => <><B p={[0, 0.75, -0.01]} s={[0.9, 0.6, 0.02]} c="#ead9a6" /><WallSocket pos={[-0.25, 1.0, 0]} plug={1} /><HomeCable pts={[[-0.216, 0.965, 0.045], [-0.25, 0.8, 0.05], [-0.2, 0.62, 0.07], [0.0, 0.56, 0.09], [0.2, 0.6, 0.1], [0.3, 0.62, 0.1]]} /></>, {elev: 0.05}),
  'ban-go-nho-chan-vuong-van-go': d3(() => <SideTable pos={[0, 0, 0]} />, {turn: 0.4, elev: 0.25}),
  'den-ban-chao-trang-than-manh-bat-tat': d3(() => <><DeskLamp pos={[-0.18, 0, 0]} on={0} /><DeskLamp pos={[0.18, 0, 0]} on={1} f={F} /></>, {dark: true, grade: 'darkInterior'}),
  'coc-tra-su-trang-vien-xanh-dia-lot': d3(() => <TeaCup pos={[0, 0, 0]} />, {elev: 0.35}),
  'bang-nam-tong-da': {k: 'grid', cols: 3, head: true, cells: (Object.keys(SKINS) as SkinName[]).map((s) => ({label: s, spec: {...VICTOR, palette: {...VICTOR.palette, ...SKINS[s]}}}))},
  'bang-net-mat': {k: 'grid', cols: 4, head: true, cells: Object.keys(EXPR).map((e) => ({label: e, spec: {...VICTOR, expr: {...EXPR[e]}}}))},
  'mat-chuan-bang-net-mat': {k: 'grid', cols: 4, head: true, cells: Object.keys(EXPR).map((e) => ({label: e, spec: matChuan({...VICTOR, expr: {...EXPR[e]}})}))},
  'bang-tu-the-tay': {k: 'grid', cols: 7, cells: (Object.keys(POSES) as PoseName[]).map((p) => ({label: p, spec: withPose(VICTOR, p)}))},
  'bang-phu-kien-latveria-mu-sat-ria-khan-tap-de': {k: 'grid', cols: 5, cells: [
    {label: 'helmet + emblem', spec: {...VICTOR, helmet: '#8a9098', emblem: '#e0b63a', palette: {...VICTOR.palette, vest: '#7a1f22', shirt: '#8a2a2c', shirtEdge: '#6a1c1e', shirtRim: '#a23a3c'}}},
    {label: 'helmet, back', spec: {...VICTOR, view: 'back', helmet: '#8a9098', palette: {...VICTOR.palette, vest: '#7a1f22'}}},
    {label: 'moustache + goatee', spec: {...DEAN, beard: undefined, moustache: '#1c1614', goatee: '#1c1614', palette: {...DEAN.palette, coat: '#9a1f24', coatLight: '#b42a30', coatDark: '#6e1418', fur: '#efe8da', furDark: '#d2c8b4', brow: '#1c1614'}}},
    {label: 'scarf', spec: {...MOTHER, hair: 'level', shawl: undefined, scarf: '#a8452e'}},
    {label: 'apron', spec: {...VICTOR, hair: 'bald', beard: '#9a968e', apron: '#5c6b3e'}},
    {label: 'child, messy', spec: {...VICTOR, build: 'child', longLegs: false, messy: true}},
    {label: 'tie', spec: {...VICTOR, tie: '#2f5d9a'}},
    {label: 'skirt + ponytail', spec: {...VICTOR, hair: 'level', skirt: '#7a3b52', ponytail: '#c8463a', palette: {...VICTOR.palette, vest: '#8a5a2e'}}},
    {label: 'child in coat', spec: {...DEAN, build: 'child', longLegs: false, hair: 'sweep', beard: undefined, messy: true, palette: {...VICTOR.palette, coat: '#6a4a2c', coatLight: '#7a5836', coatDark: '#4a3320', fur: '#a78f69', furDark: '#93794f'}}},
    {label: 'snow 1', spec: {...DEAN, snow: 1}},
    {label: 'snow 0.5', spec: {...VICTOR, snow: 0.5}},
    {label: 'girl: lashes, lips, blush, sideLocks, oval', spec: {...{...VICTOR, faceShape: 'oval', hair: 'smooth', lashes: true, lips: '#c2566a', blush: '#e58686', sideLocks: true, skirt: '#7a3b52', ponytail: '#c8463a', palette: {...VICTOR.palette, vest: '#8a5a2e'}}, expr: {...EXPR.smile}}},
    {label: 'girl, sad', spec: {...{...VICTOR, faceShape: 'oval', hair: 'smooth', lashes: true, lips: '#c2566a', blush: '#e58686', sideLocks: true, skirt: '#7a3b52', ponytail: '#c8463a', palette: {...VICTOR.palette, vest: '#8a5a2e'}}, expr: {...EXPR.sad}}},
    {label: 'girl, eyes shut', spec: {...{...VICTOR, faceShape: 'oval', hair: 'smooth', lashes: true, lips: '#c2566a', blush: '#e58686', sideLocks: true, skirt: '#7a3b52', ponytail: '#c8463a', palette: {...VICTOR.palette, vest: '#8a5a2e'}}, expr: {...EXPR.sad, closed: true}}},
    {label: 'girl, neutral', spec: {...{...VICTOR, faceShape: 'oval', hair: 'smooth', lashes: true, lips: '#c2566a', blush: '#e58686', sideLocks: true, skirt: '#7a3b52', ponytail: '#c8463a', palette: {...VICTOR.palette, vest: '#8a5a2e'}}, expr: {...EXPR.neutral}}},
  ]},
  'bang-dang-mat-va-ao-vua': {k: 'grid', cols: 6, cells: [
    ...(['round', 'square', 'long', 'heart', 'wide'] as const).map((f) => ({label: f, spec: {...VICTOR, faceShape: f}})),
    {label: 'regal + crown', spec: {...DEAN, beard: undefined, moustache: '#1c1614', goatee: '#1c1614', faceShape: 'long' as const, regal: {gold: '#e0b63a', gem: '#2a8a5a'}, crown: '#e0b63a', armL: {sh: 8, el: 10, show: true}, armR: {sh: 8, el: 10, show: true}, palette: {...DEAN.palette, coat: '#9a1f24', coatLight: '#b42a30', coatDark: '#6e1418', brow: '#1c1614'}}},
  ]},
  // d1c2: the healer's tent (src/lib3/kitLeuThayLang.tsx) and the maps of Europe and Latveria (src/lib3/kitBanDo.tsx)
  'vai-leu-nhin-tu-trong-vet-va-mui-khau': flat([720, 480], paintTentCloth({seed: 31, Wm: 1.5, Hm: 1.0, patches: [[0.3, 0.3, 0.45, 0.35], [1.0, 0.55, 0.3, 0.25]], soot: 0.3})),
  'tham-det-cu-do-nau-ba-hinh-thoi-tua-hai-dau': d3(() => <FloorRug pos={[0, 0, 0]} w={3} d={2.2} seed={5} />, {elev: 0.5}),
  'day-phoi-thao-duoc-kho-bo-la-hoa-re-toi': d3(() => <HerbLine a={[-1.3, 1.2, 0]} b={[1.3, 1.2, 0]} sag={0.06} at={[0.06, 0.2, 0.34, 0.48, 0.62, 0.76, 0.9]} size={0.36} />),
  'den-dau-dong-treo-day-ong-kinh-long-sat': d3(() => <HangingLamp pos={[0, 0.2, 0]} top={[0, 0.9, 0]} f={10} k={0.5} />, {dark: true}),
  'chau-than-sat-ba-chan-than-hong': d3(() => <Brazier pos={[0, 0, 0]} f={20} />, {dark: true, elev: 0.3}),
  'dem-rom-chan-do-soc-kem-goi-bao': d3(() => <StrawPallet pos={[0, 0, 0]} />, {turn: 0.9, elev: 0.3}),
  'ruong-go-nap-vom-dai-sat-dinh-tan': d3(() => <IronChest pos={[0, 0, 0]} />, {turn: -0.3, elev: 0.2}),
  'tham-treo-kilim-thoi-cheo-tua': d3(() => <WallHanging pos={[0, 0.8, 0]} w={1.3} h={1.1} seed={2} ground="#3a3a5a" />),
  'tui-da-cuon-day-treo-vach': flat([360, 320], paintHungThings(3)),
  'ban-thuoc-go-tho-coi-da-lo-thuy-tinh-bat-la': d3(() => <group position={[-BAN_THUOC.pos[0], 0, -BAN_THUOC.pos[2]]}><HealerTable /></group>, {turn: -0.25, elev: 0.25}),
  'lo-thuoc-thuy-tinh-xanh-la-nut-ban-tu-sang': d3(() => <><GlassVial pos={[-0.2, 0, 0]} glow={1} /><GlassVial pos={[0, 0, 0]} color="#c88a2e" kind="flask" h={0.15} /><GlassVial pos={[0.17, 0, 0]} color="#6a4426" kind="jar" h={0.17} /><Mortar pos={[0.42, 0, 0]} /></>, {dark: true}),
  'boc-ta-em-be-victor-chan-do-soc-kem-ba-hinh': flat([600, 760], paintSwaddle('hand')),
  'gay-chong-canh-cong-nam-tren': flat([80, 600], paintCane),
  'bang-treo-tay-vai-lanh-tam-giac': flat([300, 300], paintSling),
  'ban-do-chau-au-giay-kem-vong-do-latveria': d3(() => <EuropeMap f={66} w={1.6} />, {elev: 0}),
  'ban-do-latveria-lau-dai-net-dut-do-dau-x-leu': d3(() => <LatveriaMap f={35} w={1.6} />, {elev: 0}),
  // d1c5: the Europe-to-America map, the paper inserts (src/lib3/kitGiayTo.tsx), the notice board, the luggage and books (src/lib3/kitHanhLy.tsx)
  'ban-do-chau-au-toi-bo-dong-my-net-dut-do-tau-hoi': d3(() => <AtlanticMap f={30} w={1.6} t={SHOT16_T} />, {elev: 0}),
  'to-bao-cu-tranh-khac-leu-tit-viet-tay-vong-do': d3(() => <><WoodDesk w={1.3} h={1.15} /><Newspaper f={57} h={1} /></>, {elev: 0}),
  'thu-moi-phong-bi-dau-xi-huy-hieu-con-dau-tron-do': d3(() => <><WoodDesk w={1.3} h={1.55} /><InviteLetter f={67} w={0.9} pos={[0, -0.418, 0]} /></>, {elev: 0}),
  'thu-moi-cam-tay-mo-va-gap-doi': d3(() => <><HeldLetter pos={[-0.13, 0.2, 0]} /><HeldLetter pos={[0.13, 0.2, 0]} fold="half" /></>, {elev: 0}),
  'trang-so-tay-ke-dong-lo-gay-chu-tu-viet': d3(() => <><WoodDesk w={1.2} h={1.1} /><NotebookPage f={80} h={1} /></>, {elev: 0}),
  'bong-bong-nghi-may-nga-vien-nau-nguoi-ben-trong': d3(() => <ThoughtBubble f={30} at={0} pos={[0.25, 0.75, 0]} w={1.2} from={[-0.7, 0.2, 0]}><Puppet3 spec={{...MOTHER, expr: {...EXPR.happy}}} height={CAO_MAU.ba * 0.62} pos={[0, -0.68, 0]} order={645} lit={false} cast={false} /></ThoughtBubble>, {elev: 0}),
  'bang-tin-go-mai-ngoi-ba-to-ket-qua-sao-vang': d3(() => <NoticeBoard pos={[0, 0, 0]} f={40} stars={[4, 16, 28]} />, {elev: 0.1}),
  'bong-ram-tan-cay-tren-co-loang-lo-nang': d3(() => <><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[7, 4]} /><meshLambertMaterial color="#9aa46a" /></mesh><GroundShade pos={[0, 0, 0]} size={[6, 3]} rotY={0.2} seed={1} opacity={0.4} /></>, {elev: 0.6}),
  'va-li-da-nau-dung-mo-nhu-canh-tu-dai-khoa-dong': d3(() => <><Valise pos={[-0.45, 0, 0]} open={1} books={4} straps={0} /><Valise pos={[0.45, 0, 0]} books={5} straps={1} snap={0.5} /></>, {elev: 0.15}),
  'sach-mo-cam-tay-bia-da-gay-quay-ra': d3(() => <><HeldBook pos={[-0.25, 0.15, 0]} /><HeldBook pos={[0, 0.15, 0]} color="#2e3a2a" /><HeldBook pos={[0.25, 0.15, 0]} color="#3a2420" sigil spread={0.7} /></>, {elev: 0.1}),
  'sach-bay-vong-cung-lat-tron-roi-nay': d3(() => <><FlyingBook f={3} start={0} dur={6} a={[-0.6, 0, 0]} b={[0.6, 0, 0]} lift={0.3} /><FlyingBook f={8} start={0} dur={6} a={[-0.6, 0, 0]} b={[0.6, 0, 0]} color="#2e3a2a" /></>, {elev: 0.2}),
  // the globe (src/lib3/kitDiaCau.tsx)
  'qua-dia-cau-quay-luc-dia-nhieu-sac-may-troi-nen-vu-tru-tinh-van': d3(() => <><NenVuTru f={F} w={4.4} h={2.9} z={-0.3} twinkle={10} /><DiaCau f={F} lon={-20} lat={35} /></>, {elev: 0}),
  'vong-song-do-cam-lan-tren-dia-cau-ghim-co-nhan-viet-tay': d3(() => <><NenVuTru f={F} w={4.4} h={2.9} z={-0.3} twinkle={10} /><DiaCau f={F} lon={-5} lat={40}><Ghim lon={NOI.latveria[0]} lat={NOI.latveria[1]} f={F} at={0} kind="co" color="#e8302a" label="latveria" /><SongLan f={F} lon={NOI.latveria[0]} lat={NOI.latveria[1]} start={0} every={7} count={5} life={44} reach={80} /></DiaCau></>, {elev: 0}),
  'duong-cham-do-cong-va-tau-hoi-nuoc-nho-tren-dia-cau': d3(() => <><NenVuTru f={F} w={4.4} h={2.9} z={-0.3} twinkle={10} /><DiaCau f={F} lon={-38} lat={40}><Ghim lon={NOI.leHavre[0]} lat={NOI.leHavre[1]} f={F} at={0} color="#e8302a" /><DuongDi from={NOI.leHavre} to={NOI.newYork} p={0.6} f={F} /><Ghim lon={NOI.newYork[0]} lat={NOI.newYork[1]} f={F} at={0} label="nước mỹ" side={-1} /></DiaCau></>, {elev: 0}),
  // the lecture room (src/lib3/kitGiangDuong.tsx)
  'bang-den-da-phien-khung-soi-phan-tu-viet-gach-chan': d3(() => <group position={[-3.4, -1.0, 0]}><B p={[3.4, 1.75, -0.03]} s={[4.8, 2.0, 0.06]} c="#efe6cf" /><Blackboard x={3.4} y0={1.0} w={4.2} h={1.5} /><ChalkWriting f={47} /></group>, {elev: 0}),
  'ban-dai-go-soi-sam-ghe-bang-giang-duong': d3(() => <><LectureDesk pos={[-0.85, 0, 0]} seed={1} /><LectureDesk pos={[0.85, 0, 0]} seed={4} /></>, {turn: 0.5, elev: 0.25}),
  'den-treo-chao-men-xanh-ban-do-cuon-chan-dung-khung-vang': d3(() => <><B p={[0, 1.4, -0.03]} s={[3.2, 2.8, 0.06]} c="#efe6cf" /><PendantLamp pos={[-1.0, 2.8, 0.6]} drop={0.9} /><WallMap x={0.2} y={1.2} w={0.7} h={0.9} /><PictureRail y={2.5} x0={-1.5} x1={1.5} portraits={[[1.0, 0.4, 0.5]]} /><Sprite name="kho-globe" art={paintDeskGlobe} px={[200, 280]} w={0.4} pos={[-1.0, 0, 0.6]} /></>, {elev: 0.05}),
  'tuong-cua-so-cao-khung-go-op-go-soi-ngang-hong': d3(() => <group rotation={[0, -Math.PI / 2, 0]} position={[0, 0, 2.2]}><LectureWindowWall length={4.4} height={3.6} sill={0.8} head={2.8} windows={[[0.8, 2.5]]} /></group>, {turn: 0.4, elev: 0.1}),
  'toa-gach-do-thap-dong-ho-cay-phong-qua-cua-so': plate((c) => { c.save(); c.translate(500, 0); paintCollegeFront(c); paintWindowMaples(c); c.restore(); }),
  'gia-sach-chu-x-sach-mo-trang-lat-cay-thuoc': d3(() => <><BookStand pos={[-0.45, 0, 0]} flip={0} /><BookStand pos={[0.45, 0, 0]} flip={0.45} /></>, {elev: 0.12}),
  // ---- d1c3: lửa đổi màu, Mephisto, cõi lửa (src/lib3/kitCoiLua.tsx)
  'mephisto-quy-do-toc-chom-nhon-co-ao-dung-con-roi': d3(() => <Mephisto pos={[0, 0, 0]} f={F} h={4.35} pose={{armL: MEPH_POSES.raise, armR: MEPH_POSES.beckon, jaw: 0.35, grin: 0.85, squint: 0.2, nod: 0.1}} aura={0} />, {dark: true, elev: 0, pad: 1.0}),
  'mephisto-ban-tay-bang-tu-the-xoe-khep': d3(() => <>{(['raise', 'reach', 'beckon', 'fist'] as const).map((k, i) => <Mephisto key={k} pos={[-5.4 + i * 3.6, 0, 0]} f={F} h={3} pose={{armL: MEPH_POSES[k], armR: MEPH_POSES.down, grin: 0.7}} aura={0} />)}</>, {dark: true, elev: 0, pad: 1.0}),
  'tuong-lua-cat-giay-nhon-bon-sac': d3(() => <JaggedFire f={F} x0={-4} x1={4} z={0} base={0} h={[1.4, 2.6]} n={9} pal="fire" step={3} seed={4} />, {dark: true, elev: 0}),
  'ho-dung-nham-vo-nguoi-nut-sang': flat([900, 900], (c, W) => paintLava(c, W)),
  'mom-da-vo-chai-den-nhon-vien-lua': d3(() => <><ObsidianSpire pos={[-1.2, 0, 0]} h={4.2} seed={1} /><ObsidianSpire pos={[1.2, 0, 0]} h={3} seed={4} /></>, {dark: true, elev: 0}),
  'dai-khoi-cuon-do-bung-sang-troi-ngang': d3(() => <SmokeBank pos={[0, 1.2, 0]} w={8} h={2.5} f={F} seed={2} />, {dark: true, elev: 0}),
  'xich-lua-chung-xuong-noi-hai-diem': d3(() => <FireChain a={[-2.5, 2.2, 0]} b={[2.5, 1.8, 0]} f={F} link={0.35} sag={1} />, {dark: true, elev: 0}),
  'lua-doi-mau-xanh-luc-do-quy-xanh-hon-tim-vang': d3(() => <>{(['green', 'fire', 'hell', 'soul', 'violet', 'gold'] as const).map((p, i) => <ColorFlame key={p} pos={[-2.5 + i, 0, 0]} f={F + i * 7} h={0.75} w={0.5} pal={p} n={3} seed={i + 1} sparks={6} />)}</>, {dark: true, elev: 0}),
  'cot-lua-phun-tu-dat-khoi-den-toa-sang-hai-ben': d3(() => <FireColumn pos={[0, 0, 0]} f={F} at={F - 9} h={3} w={2} />, {dark: true, elev: 0.05, pad: 0.8}),
  'dat-nut-sang-do-lan-tu-tam-ra': d3(() => <GroundCracks pos={[0, 0.01, 0]} f={F} at={F - 8} r={2.4} />, {dark: true, elev: 0.55}),
  'luong-lua-phong-ngang-thuon-dau-tan-lua-roi': d3(() => <FireBolt a={[-1.8, 1, 0]} b={[1.8, 1, 0]} f={F} at={F - 9} />, {dark: true, elev: 0}),
  'long-lua-song-lua-dung-nap-vom-tren-da': d3(() => <><FloatRock pos={[0, 0, 0]} w={3.3} order={420} /><FireCage pos={[0, 0, 0]} f={F} glow={0.5} /></>, {dark: true, elev: 0, pad: 0.9}),
  'da-den-lo-lung-mat-phang-nut-dung-nham': d3(() => <><FloatRock pos={[-1.5, 0.8, 0]} w={2.6} seed={1} /><FloatRock pos={[1.4, 1.2, 0]} w={1.8} seed={4} /></>, {dark: true, elev: 0}),
  'tuong-lua-khong-lo-hang-luoi-doi-hinh-cham': d3(() => <><FlameWall f={F} x0={-5} x1={5} z={-0.2} base={0} h={[2.4, 4]} n={8} pal="ember" step={4} /><FlameWall f={F} x0={-4.5} x1={4.5} z={0} base={0} h={[1.2, 2.2]} n={12} pal="hell" seed={3} order={2} /></>, {dark: true, elev: 0}),
  'hoi-nong-boc-len-va-tro-xam-troi-ngang': d3(() => <><FlameWall f={F} x0={-3} x1={3} z={-0.6} base={0} h={[0.7, 1.3]} n={12} pal="ember" /><HeatRise f={F} box={[-3, 3, 0, 3, -0.4, 0]} n={16} opacity={0.3} /><AshDrift f={F} box={[-3, 3, 0.2, 3, -0.2, 0.2]} n={40} /></>, {dark: true, elev: 0}),
  'linh-hon-nguoi-bong-vien-sang-xanh-nhat': d3(() => <SoulFigure spec={SOUL_SPEC_CYNTHIA} height={SOUL_H_D1C2.cynthia} pos={[0, 0, 0]} />, {dark: true, elev: 0}),
  'chum-tia-lua-bung-ra-roi-xuong': d3(() => <FireBurst f={F} at={F - 7} pos={[0, 0.4, 0]} n={44} up={5} spread={2.2} size={0.03} />, {dark: true, elev: 0}),
  // d1c4, d1c5: the tent years later and the mother's chest (src/lib3/kitLeuThayLang.tsx)
  'ruong-cua-me-nap-mo-khe-sang-xanh-bua-lo-sach': d3(() => <><MotherChest pos={[-0.6, 0, 0]} seam={0.7} f={40} /><MotherChest pos={[0.6, 0, 0]} open={1} seam={0.8} f={40} /></>, {dark: true, elev: 0.15}),
  'sach-phep-bia-da-vong-khac-dau': d3(() => <><SpellBook pos={[-0.18, 0, 0]} sigil /><SpellBook pos={[0.18, 0, 0]} color="#2e3a2a" /><SpellBook pos={[0.18, 0.05, 0]} rotY={0.2} color="#4a2420" /></>, {elev: 0.7}),
  'khan-vang-cynthia-gap-va-treo-moc': d3(() => <><B p={[-0.25, 0.2, 0]} s={[0.4, 0.4, 0.3]} c="#6e4a2e" /><FoldedScarf pos={[-0.25, 0.4, -0.02]} /><B p={[0.3, 0.5, -0.05]} s={[0.08, 1.0, 0.08]} c="#4a3424" /><ScarfHook pos={[0.3, 0.86, 0.0]} /><CynthiaScarf pos={[0.27, 0.85, 0.02]} on="hook" /></>, {elev: 0.2}),
  'mang-nhen-goc-coc-co-bui': d3(() => <><B p={[0, 0.6, -0.02]} s={[1.2, 1.2, 0.02]} c="#5a4a3a" /><Cobweb pos={[-0.6, 1.2, 0]} size={0.7} seed={1} /></>, {dark: true}),
  'ban-thuoc-lat-nghieng-lo-vo-duoi-dat': d3(() => <><TippedTable pos={[0, 0, 0]} rotY={0.3} /><BrokenGlass pos={[0.3, 0, 0.5]} /></>, {elev: 0.3}),
  'dem-rom-cuon-dung-buoc-day': d3(() => <RolledPallet pos={[0, 0, 0]} />),
  'do-cu-cua-me-gio-may-chan-soc-guong-dong': d3(() => <group position={[-2.25, 0, 4.2]}><MotherThings /></group>, {elev: 0.25}),
  'coc-chac-treo-ao-choang-nau-co-long': d3(() => <CloakPeg pos={[0, 0, 0]} scarf />),
  'ban-tho-dung-cu-banh-rang-day-dong': d3(() => <WorkBench pos={[0, 0, 0]} />, {elev: 0.35}),
  'do-choi-banh-rang-hop-dong-canh-quat': d3(() => <GearToy pos={[0, 0, 0]} spin={0.4} />, {elev: 0.2}),
  'co-may-hai-cuon-dong-banh-rang-bong-den': d3(() => <CoilMachine pos={[0, 0, 0]} on={1} arc={0.6} f={10} />, {dark: true, elev: 0.15}),
  // d1c4: the Baroness's bedchamber (src/lib3/kitPhongNgu.tsx)
  'giuong-bon-cot-man-nhung-do-thoi-vang-dem-goi-toc-vang': d3(() => <group position={[0.6, 0, 5.85]}><CanopyBed state="open" f={F} /></group>, {dark: true, grade: 'darkInterior', turn: -0.35, elev: 0.1}),
  'ban-dau-giuong-go-cham-nen-cao-chau-dong-lo-thuoc': d3(() => <SickbedTable pos={[0, 0, 0]} f={F} />, {dark: true, grade: 'darkInterior', turn: -0.3, elev: 0.25}),
  'cua-so-vom-hai-o-kinh-chi-thoi-nhin-ra-dem-trang': d3(() => <><mesh position={[0, 1.0, -1.2]}><planeGeometry args={[3, 2.4]} /><meshBasicMaterial map={tex('kho-night-view', 900, 720, paintNightView(3, 2.4))} toneMapped={false} /></mesh><B p={[0, -0.03, -0.15]} s={[1.6, 0.04, 0.3]} c="#4c5452" /><MullionWindow w={1.2} h={2.0} /></>, {dark: true, grade: 'darkInterior'}),
  'cua-go-soi-vom-tron-dai-sat-dinh-tan': d3(() => <><ArchDoor w={1.1} h={2.3} inset={0} /><group position={[1.6, 0, 0]}><ArchDoor w={1.1} h={2.3} inset={0} open={1.2} /></group></>, {elev: 0.08}),
  'tham-treo-do-thoi-vang-lon-vien-thoi-nho-tua-vang': d3(() => <Tapestry pos={[0, 2.1, 0]} w={1.38} h={2.0} />, {elev: 0.05}),
  'khien-son-do-thoi-vang-tren-cong-da': d3(() => <WallShield pos={[0, 0.8, 0]} s={0.42} />, {elev: 0.05}),
  'gia-nen-sat-ba-chan-cuon-ba-ngon-nen': d3(() => <IronCandleStand pos={[0, 0, 0]} f={F} />, {dark: true, grade: 'darkInterior', elev: 0.15}),
  'ruong-go-cham-o-vom-dem-do-tua-vang': d3(() => <><CarvedChest pos={[0, 0, 0]} /><CarvedChest pos={[1.6, 0, 0]} w={1.1} h={0.8} cushion={false} /></>, {turn: 0.35, elev: 0.2}),
  'guom-deo-hong-chuoi-vang-bao-da-do': d3(() => <HipSword pos={[0, 0.95, 0]} tilt={0} />, {elev: 0.05}),
};

// ---------------------------------------------------------------- the three kinds of preview
const BG = '#ece7dd', FLOOR = '#d9d2c5', BG_DARK = '#2c3149', FLOOR_DARK = '#3a4059';

const Flat: React.FC<{p: Extract<Prev, {k: '2d'}>; w: number; h: number}> = ({p, w, h}) => {
  const url = useMemo(() => { const cv = document.createElement('canvas'); cv.width = p.px[0]; cv.height = p.px[1]; p.art(cv.getContext('2d')!, p.px[0], p.px[1]); return cv.toDataURL('image/png'); }, [p]);
  if (p.plate) return <Img src={url} style={{position: 'absolute', left: 0, top: (h - (w * 9) / 16) / 2, width: w, height: (w * 9) / 16}} />;
  const s = Math.min((w * 0.8) / p.px[0], (h * 0.8) / p.px[1]), iw = p.px[0] * s, ih = p.px[1] * s, base = h * 0.9;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: base - ih * 0.04, bottom: 0, background: FLOOR}} />
      <div style={{position: 'absolute', left: (w - iw * 0.7) / 2, top: base - ih * 0.035, width: iw * 0.7, height: ih * 0.07, borderRadius: '50%', background: 'rgba(60,50,40,0.22)', filter: 'blur(6px)'}} />
      <Img src={url} style={{position: 'absolute', left: (w - iw) / 2, top: base - ih, width: iw, height: ih}} />
    </>
  );
};

/** Frames whatever stands in the group: the camera is set from the group's real box, so no piece needs its size written down. */
const Fit: React.FC<{p: Extract<Prev, {k: '3d'}>}> = ({p}) => {
  const grp = useRef<THREE.Group>(null), key = useRef<THREE.DirectionalLight>(null), floor = useRef<THREE.Mesh>(null), {camera, scene, size} = useThree();
  const grade: Grade = p.grade ?? (p.dark ? 'nightExterior' : 'dayExterior'), g = GRADES[grade], bg = p.dark ? BG_DARK : BG, elev = p.elev ?? 0.12, pad = p.pad ?? 1.22;
  useLayoutEffect(() => {
    const G = grp.current!; G.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(G), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const cam = camera as THREE.PerspectiveCamera, t = Math.tan((28 * Math.PI) / 360), D = Math.max(s.y / 2 / t, s.x / 2 / (t * (size.width / size.height))) * pad + s.z / 2;
    cam.fov = 28; cam.near = D / 60; cam.far = D * 60; cam.position.set(c.x, c.y + Math.sin(elev) * D, c.z + Math.cos(elev) * D); cam.lookAt(c); cam.updateProjectionMatrix();
    scene.background = new THREE.Color(bg); scene.fog = new THREE.Fog(bg, D * 2.4, D * 10);
    floor.current!.position.y = box.min.y - 0.003;
    const R = Math.max(s.x, s.y, s.z) * 0.8 + 0.5, L = key.current!;
    L.position.set(c.x - 0.64 * R * 3, box.min.y + 0.59 * R * 3, c.z + 0.48 * R * 3); L.target.position.set(c.x, box.min.y, c.z); L.target.updateMatrixWorld();
    const sc = L.shadow.camera; sc.left = sc.bottom = -R * 1.7; sc.right = sc.top = R * 1.7; sc.near = 0.05; sc.far = R * 9; sc.updateProjectionMatrix(); L.shadow.needsUpdate = true;
  });
  return (
    <GradeCtx.Provider value={grade}>
      <hemisphereLight args={[g.sky, g.ground, g.fill * (p.dark ? 1.25 : 1)]} />
      <directionalLight ref={key} intensity={g.key} color={g.keyColor} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005} />
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6000, 6000]} /><meshLambertMaterial color={p.dark ? FLOOR_DARK : FLOOR} /></mesh>
      <group ref={grp} rotation={[0, p.turn ?? 0, 0]}>{p.el()}</group>
    </GradeCtx.Provider>
  );
};

const HEAD = {x: 190, y: 0, w: 644, h: 600};   // the head's part of the mould box, in box pixels
const Grid: React.FC<{p: Extract<Prev, {k: 'grid'}>; w: number; h: number}> = ({p, w, h}) => {
  const urls = useMemo(() => p.cells.map((cell) => { const cv = document.createElement('canvas'); paintFigure(cv, cell.spec, 1); return cv.toDataURL('image/png'); }), [p]);
  const rows = Math.ceil(p.cells.length / p.cols), cw = (w - 24) / p.cols, ch = (h - 16) / rows - 26, part = p.head ? HEAD : {x: 0, y: 0, w: BOX.w, h: BOX.h};
  const s = Math.min(cw / part.w, ch / part.h);
  return (
    <div style={{position: 'absolute', inset: '8px 12px', display: 'grid', gridTemplateColumns: `repeat(${p.cols}, 1fr)`, alignContent: 'start'}}>
      {p.cells.map((cell, i) => (
        <div key={cell.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{width: part.w * s, height: part.h * s, overflow: 'hidden', position: 'relative'}}><Img src={urls[i]} style={{position: 'absolute', left: -part.x * s, top: -part.y * s, width: BOX.w * s, height: BOX.h * s}} /></div>
          <div style={{font: '600 17px/26px Menlo, monospace', color: '#3a342c'}}>{cell.label}</div>
        </div>
      ))}
    </div>
  );
};

const STRIP = 78;
/** the store's composition for one catalogue: entry i on frame i (chung: KHO_ITEMS + PREVIEWS; a channel passes its own) */
export const khoAsset = (items: Entry[], previews: Record<string, Prev>): React.FC => () => {
  const f = useCurrentFrame(), {width, height} = useVideoConfig(), e = items[Math.min(f, items.length - 1)], p = previews[e.id], h = height - STRIP;
  return (
    <AbsoluteFill style={{background: p && p.k === '3d' && p.dark ? BG_DARK : BG}}>
      <div key={e.id} style={{position: 'absolute', left: 0, top: 0, width, height: h, overflow: 'hidden'}}>
        {!p ? <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 40px sans-serif', color: '#c0392b'}}>CHƯA CÓ ẢNH XEM TRƯỚC</div>
          : p.k === '2d' ? <Flat p={p} w={width} h={h} />
          : p.k === 'grid' ? <Grid p={p} w={width} h={h} />
          : <ThreeCanvas width={width} height={h} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv /><Fit p={p} /></ThreeCanvas>}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: STRIP, background: '#2b2823', color: '#f3ede2', padding: '9px 16px', boxSizing: 'border-box'}}>
        <div style={{font: '700 23px/30px "Helvetica Neue", Arial, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.ten}</div>
        <div style={{font: '15px/24px Menlo, monospace', color: '#cbbf9f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.nhom}/{e.id}</div>
      </div>
    </AbsoluteFill>
  );
};

export const KhoAsset = khoAsset(KHO_ITEMS, PREVIEWS);
// ba ảnh bối cảnh chương 6 (khai ở đây, không sửa file bối cảnh): sân trường chạng vạng góc b, phòng thí nghiệm chạng vạng cửa đóng chốt cài, giảng đường bảng đã lau
const KhoSan: React.FC = () => <CampusStill time="chang-vang" view="b">{null}</CampusStill>;
const KhoLab: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><LabFinish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv /><Lab view="wide" gio="chang-vang" door={1} bolt={1} /></ThreeCanvas></LabFinish></AbsoluteFill>; };
const KhoGiangDuong: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><LabFinish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><AutoRecv /><GiangDuong f={0} bangSach /></ThreeCanvas></LabFinish></AbsoluteFill>; };
export const CatalogComps: React.FC = () => <>
  <Composition id="kho-asset" component={KhoAsset} width={960} height={720} fps={24} durationInFrames={KHO_ITEMS.length} />
  <Composition id="campus-chang-vang-trong" component={KhoSan} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="lab-chang-vang-cua-chot-trong" component={KhoLab} width={1280} height={720} fps={24} durationInFrames={1} />
  <Composition id="giang-duong-bang-sach-trong" component={KhoGiangDuong} width={1280} height={720} fps={24} durationInFrames={1} />
</>;
