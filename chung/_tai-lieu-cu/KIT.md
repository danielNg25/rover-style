# KIT: API reference for shot builders

> **Thay đổi theo luật bản 3 (21/11/2026), xem `LUAT-CUTOUT3D-v3.md`.** Chỗ nào bên dưới còn trái thì theo các dòng này:
> - Chỉ nhân vật đổi hình mỗi 2 khung. Lửa, khói, hạt, quầng sáng, vật bật ra chạy mọi khung (`Flame` có `cadence`, mặc định 1).
> - `<Stage>` mặc định `shadows="cast"`: bóng thật từ đèn chính của bối cảnh. `BlobShadow` chỉ còn dùng cho nhân vật bay và vệt dưới gấu áo ở phòng tối.
> - Camera: thêm `camRoll` (nghiêng 0,5–2 độ) và `camArc` (đi cung); sàn tốc độ hạ xuống 0,2 %/giây. Luật "không bao giờ xoay" bị bỏ.
> - `Glow` không còn giới hạn một cái mỗi cảnh: quầng sáng được dùng cho mọi nguồn sáng ở cảnh đêm, chạng vạng và cảnh gần.
> - `Motes` (mới): hạt chọn theo thứ có trong cảnh (`dust`, `embers`, `magic`, `fireflies`); không bật sẵn.
> - `PopIn`: lớn lên từ một chấm, vượt cỡ rồi co về trong 8 khung, mọi khung; khói đến sau.
> - Cận và trung: nền mềm hơn nhân vật (`NearBlur` quanh phần xa của bối cảnh, hoặc hai lớp canvas như `src/demo/GraveTest.tsx`).
> - Nhân vật mới dùng `src/mould/` (`draw.ts`, `Puppet3`, `act`, `blink` với ba kiểu chớp).


Import everything from `src/kit` (one surface). Do not import `src/three/Post`, `src/shots/flat2d`, `bkit`, `sprite` or `space` in new shots: those built the soft, hazy look the audit rejected. Living examples: `src/demo/KitDemo.tsx` (compositions `kit-demo-interior`, `kit-demo-exterior`, `kit-demo-space`).

Units: world units (a person is about 1.7-3 tall), angles in degrees unless a prop is called `rot` on a 3D object (`rot: [x, y, z]` radians, as three.js). `f` is the frame inside the shot. Every component is a pure function of its props: no `Math.random`, no `Date`.

## 1. Stage and finish

| Export | Purpose | Props |
|---|---|---|
| `Stage` | Wraps the whole shot: camera, lights, background. No post-processing exists: the picture is crisp front to back, no depth of field, no bloom, no grain | `cam` (a rig), `f`, `len`, `mood`, `bg?`, `light?` (scale 0.8-1.2), `shadows?` ('none' default, 'cast'), `name?`, `camMax?` (raise the 8 %/s ceiling, only when the script calls for a fast move) |
| `MOODS` | Lighting presets: `dayInterior`, `nightInterior`, `dayExterior`, `dusk`, `nightExterior`, `space` | each: sky, ground, hemi, key, keyI, keyPos, bg |
| `StageCanvas` | The canvas of a stand-alone composition | `bg?`, `vignette?` (clamped to 0.05, default 0) |
| `KitShot`, `shotComp(shot)` | Shot type `{id, len, bg?, Scene({f, t}), liveness}` (also fits the old `ShotDef` registries) and its Remotion component. `liveness` is REQUIRED; the composition throws, with the list of failures, while the shot fails `checkLiveness` | |
| `litColor(mood, hex, face?)`, `solidFor(mood, want, face?)` | Colour a lit solid really shows under a mood, and the colour to give a solid so that it shows the one you want (section 4) | `face`: 'front' (default), 'top', 'left', 'right' or a normal |
| `NearBlur` | The ONLY blur: wrap one near-foreground edge object (pillar, branch, shoulder) | `radius` (world units; aim 4-8 px) |
| `BlobShadow` | The only shadow a figure gets: a flat blob on the ground | `pos`, `r`, `sy?`, `color?`, `opacity?` |

`Stage` checks the camera of every shot and THROWS (in every mode) when `cam` is a fixed pose, or when the rig: is static on any frame pair; moves slower than 0.5 %/s or faster than 8 %/s; jerks (one frame moves more than 3 times the typical frame: a snap zoom, a jitter, a `camFollow` whose target steps on twos). Frames inside a `camShake` are skipped. There is no switch to turn the check off; only a one-frame `Still` (`len` 1) is exempt.

## 2. Camera rigs (pure functions `f => {pos, look, fov}`; smooth, on ones; translate, never rotate)

Every rig takes a base pose or another rig, so they chain: `camTruck(camPush(base, {pctPerSec: 1}), {pctPerSec: 2.5})`.

| Export | Purpose | Options (defaults) |
|---|---|---|
| `camPush(base, o)` | Subject at `look` grows at constant speed | `pctPerSec` 2 (bible: 1-3) |
| `camPull(base, o)` | Subject shrinks | `pctPerSec` 2 |
| `camTruck(base, o)` | Slide sideways, percent of frame width per second | `pctPerSec` 2, `dir` 1 or -1, `ease`+`len` (gentle ease that never stops) |
| `camPedestal(base, o)` | Slide vertically | same as truck |
| `camFollow(base, target, o)` | Keep a moving world point framed as on frame 0 | `target: f => V3` must be SMOOTH (a formula of `f`, not a puppet position that steps on twos), `gain` 1 |
| `camHold(base, o)` | Held frame with drift, for shots where the picture changes | `driftPctPerSec` 0.7, `seed` |
| `camShake(base, o)` | Impact only, 2-6 frames | `at`, `dur` 4, `amp` 0.6 |
| `camSpeed(rig, len)`, `assertCamMoves(rig, len, name, {min, max})` | Measured speed in %/s; the guard `Stage` runs (static, too slow, too fast, jerky: all throw) | |

## 3. Timing (characters and effects ON TWOS; cameras smooth)

| Export | Purpose |
|---|---|
| `twos(f)`, `steps(f, n)` | Frame quantised to 2 (or n) frames. Feed this to any acting or effect formula |
| `track(f, [[frame, value], ...], n = 4)` | Pose-to-pose track on twos (key frames EVEN): from each key frame the value reaches the new pose over `n` frames in even steps with a half-size last step, then holds exactly. The largest step of one drawing is `change / (n/2 - 0.5)`. `n = 0` snap (faces, hand swaps), 4 for heads and bodies, 8-12 for arms |
| `nFor(change, perDrawing)` | The `n` a change needs so that no drawing moves further than `perDrawing`: `track(f, keys, nFor(90, 22))` |
| `trackObj(f, [[frame, {a, b}], ...], n = 4)` | The same for a bag of named numbers; missing fields keep their value |
| `trackStep(f, [[frame, anything], ...])` | Discrete swaps (sprite or face name) |
| `idle(f, seed, hold = 10)` | -1..1 held offset that changes every `hold` frames through one in-between. Use for bob (x 2-4 px) and tilt (x 3 deg). Not a sine |
| `prog(f, f0, dur)` | 0..1 progress of an event on twos (draw-ons, wipes) |
| `blinkAt(f, [frames], dur = 4)` | Hand-placed blinks only |
| `cutLead(anchorFrame, lead = 10)`, `anchorIn(lead)` | Shot start so the anchor word lands `lead` frames in; the in-shot frame of the word |
| `camTween(f, f0, f1, a, b)`, `inOut`, `easeOut`, `outBack`, `sec(s)`, `FPS` | SMOOTH (on ones): camera and set pieces only (a door, a sun). Never a figure: a `Puppet` throws when its pose changes on an odd frame |

A pose change of more than about 15 px (head) or 25 px (hand) needs at least one in-between drawing, a large one two (bible 8.5): never `n = 0` or 2 on such a move. Characters go through `Puppet` + `act()` (PUPPET.md), which stage and check this by themselves; a hand-built figure from shapes (as in section 7) is for a simple background role, and there YOU must keep every moving value on `track` / `idle` / `twos(f)`.

## 4. Solids, flat shapes, pictures, text

Solids (lit, flat-shaded, `cast` false by default): `Box{size}`, `Cyl{r, r2?, h, seg?}`, `Cone{r, h, seg?}` (seg 4 = pyramid), `Ball{r, shade?}` ('bands' default = three hard tone blocks, 'flat', 'smooth'). Common: `pos, rot, scale, color, cast?, receive?, unlit?, opacity?`.

**A lit solid does not show the hex you give it.** Solids take the mood's light; flat cards and pictures do not. Night moods darken and blue a solid a lot, so a `Box` and a `Rect` of one prop mismatch unless you correct for it. What a solid shows (front face / top face):

| Mood | cream `#e9e2cf` front | top | grey `#808080` front | top | wood `#8a5a40` front |
|---|---|---|---|---|---|
| `dayInterior` | #dfcfae | #f6e4c1 | #7a746b | #878177 | #845234 |
| `nightInterior` | #a3918a | #b3a5a2 | #585053 | #615c63 | #5f3728 |
| `dayExterior` | #d8d3b4 | #f7eed6 | #76776f | #888784 | #805337 |
| `dusk` | #bd896f | #dea274 | #664b42 | #7a5a45 | #6f331e |
| `nightExterior` | #6d748c | #8d96b2 | #393f55 | #4b536e | #3e2a28 |
| `space` | #d5cdbc | #e7dec7 | #757374 | #7f7d7b | #7e5139 |

Three ways to make parts agree: (1) a card that sits on a solid takes `color={litColor(mood, solidHex)}`; (2) a solid that must show an exact colour takes `color={solidFor(mood, wanted)}` (clamped when the mood cannot reach it: a night mood cannot show a bright cream on a solid); (3) a small prop that must read at night (a pot, a lantern body, a sign post) takes `unlit` and shows exactly its hex. In `nightExterior` and `nightInterior` give solids hexes about twice as light as the tone you want, or use (2).

Flat cards (unlit, drawn in local XY; common `color, pos?, rot?, scale?, opacity?, order?, add?`): `Poly{pts}`, `Rect{w, h}`, `RoundRect{w, h, r}`, `Disc{r, sy?}`, `Arc{r1, r2, a0?, a1?}`, `Diamond{w, h?}`, `Stroke{pts, width, p?, taper?, dash?}` (line drawn up to fraction `p`: the draw-on primitive). Curve helpers: `bezier(p0, p1, p2, n?)`, `circlePts(c, r, a0?, a1?, n?, sy?)`. Stack coplanar cards with small z steps (0.004).

`order` (draw order): leave it out. Opaque things are sorted by depth. Anything see-through (`opacity` below 1, `add`, `LightShaft`, `Glow`, `NearBlur`, a `Card` with `opacity`) is drawn late by itself (order 500), after the puppets (10-30), so a tinted pane or a light shaft IN FRONT of a figure tints it, and one BEHIND a figure is hidden by it (depth is still tested). Marks draw at 900, name tags at 990. Pass `order` only to sort see-through things among themselves (higher = later = on top).

Reference pixel space: `const m = refSpace({cam, fov})` then `m.pt(px, py, z)` (world point seen at that 1280x720 pixel on frame 0 at depth z), `m.len(px, z)`, `m.ppu(z)`; `<RefPlane m z>` takes children in frame pixels, y down. Each card keeps a real depth, so camera moves give true parallax.

Pictures (PNG with alpha under `public/`): `Card{src, height, pos?, pivot?, rot?, flip?, tint?, opacity?, crop?, cast?}` with children in the picture's own pixels; `Piece{src, at, pivot, rot?, scale?, sy?, flip?, z?, hide?, crop?, tint?}` inside a pixel space; `useTex(src)`. Jointed puppets: `ImageRig`, `rigPoint`, `useTextures`, types `ImgRigDef`, `ImgPart`, `PartPose` (unchanged engine from `src/three`).

Text (in-world only, Vietnamese with full diacritics): `SignText{text, pos?, rot?, height, color?, board?, boardPad?, upper?, weight?, font?}` (uppercase by default); `NameTag{text, pos, height, to, p?, tone?}` (lowercase bold, `pos` = left end of the baseline, `to` = arrow target relative to `pos`, `p = prog(f, 0, 14)`, tone 'black' or 'white'). `KIT_FONT`.

Deterministic helpers: `rand(seed)`, `hash(a, b)`, `pick(list, a, b)`, `clamp`, `lerp`, `lerp3`, `deg`; types `V3`, `Pt`.

## 5. Ambient and effects (all flat and crisp; boil on twos)

| Export | Purpose | Main props |
|---|---|---|
| `Flame` | Three fat tongues as one mass, reshaped every 2 frames, 3 tones, no halo | `pos, w, h, f, seed?, colors?, embers?` (3-6) |
| `Smoke` | 4-8 flat circles rising, growing, shrinking away | `pos, f, count?, size?, rise?, spread?, tones?` |
| `Puff` | One-off burst of 4-8 circles | `pos, f, f0, dur?, r?, count?, color?` |
| `PopIn` | Children scale in with one overshoot, plus a puff | `f, f0, pos?, puff?, puffR?` |
| `StarField` | Sparse crisp diamonds, constant brightness, the SAME size on screen at any depth | `pos, size` (world), `count?` (36; warns above 120, throws above 300), `px?` = [min, max] width of a star in pixels of a 720p frame (default [6, 11]; allowed 4-24, smaller throws because it renders as a soft dot), `colors?` |
| `Clouds` | Lumpy flat clouds in 3 tones, slow drift | `pos, size, f, count?, scale?, tones?, speed?` |
| `SkyBands` | Flat horizontal sky bands, top to bottom | `pos, size, colors, shares?` |
| `Birds` | 1-7 flat silhouettes, wings in held poses | `pos, f, count?, size?, span?, speed?, color?` |
| `Weather` | Snow or rain in two depth layers (40+ particles) | `kind, pos, size, f, count?, wind?, grain?` |
| `ClothSway` | Banner (fixed on top) or flag (fixed on the left) | `kind?, pos, w, h, f, color, stripe?, notch?, amp?` |
| `LightShaft` | One pale trapezoid, 12-30 % opaque | `pos, angle?, w0, w1, len, f, color?, opacity?` |
| `Glow` | One smooth disc (no rings) for MAGIC, ENERGY HELD BY A CHARACTER or a SCREEN only: never on a fire, thruster, lamp, window or star. `strength` = opacity at the centre, clamped to 0.3. A second `Glow` in the same `Stage` THROWS | `pos, r, color, strength?, f?` |
| `WaterShimmer` | Short light dashes that stretch and shrink in place | `pos, size, f, rot?, count?, dash?, color?` |
| `Crowd` | 3-8 silhouettes (or your puppets via `render`), each idling on its own phase | `pos, f, count?, h?, gap?, tones?, skin?, depth?` |
| `MarkCircle`, `MarkTick`, `MarkStrike`, `MarkRoute` | Hand-drawn draw-on marks; pass `p = prog(f, f0, dur)` | `r` / `size` / `a, b` / `pts, dash?` plus `pos?, color?, width?` |

## 6. Liveness declaration (required)

`liveness('wideInterior', [{name, kind: 'camera' | 'puppet' | 'ambient' | 'effect' | 'state', family?, beats?: number[], box?, note?}, ...])` goes in `KitShot.liveness`. `shotComp` runs `checkLiveness(decl, len)` and refuses to render while it returns failures (bible 7.2):

- a camera mover is declared;
- every ambient mover has a `family` from the allowed list: `flame` (fire, candle, thruster), `smoke` (also steam), `cloth`, `sky` (clouds, birds, bats), `light` (a shaft, a lamp or window switching, a pulse), `weather`, `foliage`, `water`, `extras` (background figures), `creature`, `mechanical` (a wheel, a ring, a gauge, any prop loop), `paper`, `ink`. Dust, motes, flares, bloom and twinkle are not families and fail. Constant stars do not move, so they are not a mover;
- mover and ambient-family floors per shot type (`LIVENESS_FLOORS`: wide 3 families / 5 movers, medium 2 / 4, close and insert 1 / 3, abstract 4 / 5);
- a wide or medium shot has a figure that acts: a `puppet` mover with at least one beat;
- at least one beat, and one per 1.5 s; no two puppets change on the same frame.

Shot types: `wideExterior, wideInterior, medium, close, insert, abstract`. Declare only what is really in the picture.

## 7. Minimal complete shot

```tsx
import React from 'react';
import {Stage, KitShot, camPush, liveness, Box, Rect, Poly, Disc, Flame, ClothSway, SignText, NameTag,
  BlobShadow, PopIn, MarkTick, track, trackStep, idle, prog, deg} from '../kit';

const LEN = 60;                                    // 2.5 s; the anchor word lands on frame 10
const cam = camPush({pos: [0, 2.2, 11], look: [0, 2, 0], fov: 30}, {pctPerSec: 2});

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  // baker: beats on twos. 10 head tips to the tray | 24 looks up, smiles | 40 arm up to show the stamp
  const head = track(f, [[0, 0], [10, 8], [24, -3]], 4);
  const arm = track(f, [[0, -70], [40, 35]], 8);
  const mouth = trackStep(f, [[0, 'flat'], [24, 'smile']]);
  const bob = idle(f, 1) * 0.02;
  return (
    <Stage cam={cam} f={f} len={LEN} mood="dayInterior" name="bakery">
      {/* set: floor, wall in two tones, counter, oven with fire */}
      <Box size={[16, 0.2, 9]} pos={[0, -0.1, 0]} color="#b98a62" />
      <Box size={[16, 7, 0.3]} pos={[0, 3.5, -3]} color="#e6dcc6" />
      <Rect w={16} h={1.4} pos={[0, 0.7, -2.84]} color="#c9b99a" />
      <Box size={[4, 1.1, 1.2]} pos={[1.2, 0.55, 0.6]} color="#a8754c" />
      <Box size={[2.6, 3, 1]} pos={[-3.6, 1.5, -2.3]} color="#9a8f8a" />
      <Rect w={1.5} h={1.2} pos={[-3.6, 1, -1.79]} color="#2a2230" />
      <Flame pos={[-3.6, 0.5, -1.78]} w={0.5} h={0.9} f={f} seed={1} embers={3} />
      <SignText text="Lò Bánh Mì" pos={[1.4, 4.4, -2.8]} height={0.5} color="#5a3c2e" board="#f3e6c0" />
      <ClothSway kind="banner" pos={[4.8, 5, -2.75]} w={1} h={2.2} f={f} color="#c9483c" stripe="#f3e6c0" />
      {/* baker: a flat figure; body, head (tips), eyes, mouth (swaps), arm (eases on twos) */}
      <group position={[-0.6, 0, -0.4]}>
        <BlobShadow pos={[0, 0.01, 0.1]} r={0.6} />
        <Poly pts={[[-0.5, 0], [-0.4, 1.3], [0.4, 1.3], [0.5, 0]]} color="#f3efe4" pos={[0, bob, 0]} />
        <group position={[0.38, 1.2 + bob, 0.02]} rotation={[0, 0, deg(arm)]}>
          <Rect w={0.7} h={0.2} pos={[0.35, 0, 0]} color="#f3efe4" /><Disc r={0.12} pos={[0.72, 0, 0.002]} color="#f0c9a0" />
        </group>
        <group position={[0, 1.3 + bob, 0.01]} rotation={[0, 0, deg(-head)]}>
          <Disc r={0.48} pos={[0, 0.42, 0]} color="#f0c9a0" />
          {[-0.18, 0.18].map((x) => <Disc key={x} r={0.05} pos={[x + head * 0.008, 0.48, 0.004]} color="#22222c" />)}
          <Rect w={mouth === 'smile' ? 0.26 : 0.14} h={0.05} pos={[0, 0.24, 0.004]} color="#8a3b32" />
        </group>
      </group>
      <NameTag text="thợ làm bánh" pos={[-3, 3.2, -0.3]} height={0.4} to={[2, -0.7]} p={prog(f, 0, 14)} />
      <PopIn f={f} f0={40} pos={[1.6, 2.2, 0.7]} puffR={0.3}><MarkTick size={0.5} /></PopIn>
    </Stage>
  );
};

export const BAKERY: KitShot = {id: 'bakery', len: LEN, bg: '#e6dcc6', Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'push 2 %/s'},
  {name: 'baker', kind: 'puppet', beats: [10, 24, 40]},
  {name: 'oven fire', kind: 'ambient', family: 'flame'}, {name: 'banner', kind: 'ambient', family: 'cloth'},
  {name: 'tick pops in', kind: 'effect', beats: [40]},
])};
```

Register it: `<Composition id="bakery" component={shotComp(BAKERY)} width={1280} height={720} fps={24} durationInFrames={BAKERY.len} />`. 

Checks before reporting:

```bash
npx tsc --noEmit            # types (pick ids of the rigs are checked here)
./kit-check.sh              # no browser: twos rule, in-between rule, pick checks, camera guard, liveness
for f in 0 30 59; do ./still.sh bakery $f; done   # out/bakery-0.png, -30.png, -59.png (sandbox disabled: Chrome)
```

`./still.sh <composition-id> [frame] [scale]` renders ONE frame to `out/<id>-<frame>.png` (the older `render-still.sh` only renders frame 0). Look at the first, a middle and the last frame; a shot that throws prints the reason (static camera, second glow, liveness failure, a puppet changing on an odd frame).

## 8. Do / do not (from AUDIT.md section 2 and bible section 8)

| Do | Do not |
|---|---|
| Keep every plane sharp; at most one `NearBlur` edge object, in about one close-up in three | Add any depth of field, soft focus or background blur; import `Post` |
| Draw lamps, lanterns, windows, fires and thrusters as flat cream or yellow shapes | Put a `Glow`, halo or bloom on them; `Glow` is for magic, energy held by a character or a screen, one per shot (a second one throws) |
| Use `StarField` with tens of stars, constant brightness | Twinkle, halo discs, four-point flares, hundreds of specks |
| Add particles only when the place explains them (`Weather`, `embers`, magic motes) | Add a generic floating dust layer; sprinkle glints on gold or water |
| Act characters with `Puppet` + `act()`; hand-built figures with `track` / `trackObj` / `idle` so values change every 2nd frame with staged in-betweens | Tween a figure per frame (`camTween` is for cameras and set pieces), pop a head 30 px in one frame, add continuous sine wobble |
| Place blinks by hand with `blinkAt` where they serve the beat | Blink on a timer |
| Use `Flame` (one deforming mass) and `Smoke` (few fat circles) | Re-randomise spikes with a per-step hash: it strobes |
| Move the camera with a rig from frame 0 to the cut; linear push 1-3 %/s; give depth layers real z so they parallax | Leave the camera static, ease to a stop, rotate, snap-zoom, jitter, slide all layers together (the guard throws on the first, fourth and fifth) |
| Give night props `unlit` or `solidFor(mood, hex)`; match a card on a solid with `litColor` | Expect a lit `Box` to show its hex at night |
| Keep brightness moderate (bright interior mean luma about 150), whites cream, vignette 0-5 % | Light floors to near white; darken corners |
| Flat cut-paper shapes: 2-3 tones, no outlines; `Ball` in 'bands' | Smooth 3D-looking shading on characters, animals or props; faceted gold balls |
| One `BlobShadow` under a figure | Cast shadows onto walls; leave stray geometry in frame |
| Text in the set (`SignText`, `NameTag`), 1-4 words, full diacritics | Overlay captions; pure-white text plates |
