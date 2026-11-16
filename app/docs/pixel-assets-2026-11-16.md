# 픽셀 에셋 제작 기록

제작 도구: 내장 `image_gen` 이미지 생성. CLI/API 우회 없이 에셋별로 새 이미지를 생성했다.
생성 결과를 확인한 뒤 브라우저 Canvas에서 최근접 축소와 WebP 인코딩(품질 0.94)을 적용했다.
두더지는 생성된 알파 채널을 유지한다. 원본은 도구의 기본 생성 폴더에 보존했다.

| 최종 프로젝트 경로 | 규격 | 용도 |
| --- | --- | --- |
| `src/pages/WhackGame/assets/mole.webp` | 320×320, 투명 | 플레이 캐릭터와 시작 화면 |
| `src/assets/game-covers/whack.webp` | 960×640 | 두더지 잡기 커버 |
| `src/assets/game-covers/oddcolor.webp` | 960×640 | 다른색 찾기 커버 |

## 두더지 생성 프롬프트

Use case: stylized-concept. Asset type: single transparent sprite for a cute whack-a-mole browser game. Create a NEW, exquisitely cute 16-bit pixel art mole character, front-facing upper body, round cocoa-brown head and plump body, small rounded ears, glossy black pixel eyes with one cream glint each, tiny dusty-rose oval nose, cream muzzle and belly, pink blush cheeks, a tiny happy mouth, two little paws raised at shoulder level with small cream claws, three-pixel hair tuft. Authentic chunky square-pixel clusters and clean stepped dark brown outline, restricted warm palette, 2-3 flat shading levels, no anti-aliasing, no smooth gradients, no 3D. Symmetrical friendly pose, recognizable at 64 pixels. Entire single character centered and filling 85 percent of square canvas with transparent padding around all edges. Character bottom is a rounded torso ending, no hole, no dirt, no scenery, no shadow, no text, no border, no extra sprites. Genuinely transparent alpha background. Output square PNG.

## 두더지 잡기 커버 생성 프롬프트

Use case: stylized-concept. Asset type: landscape 3:2 cover illustration for a whack-a-mole mini game, must read beautifully at 300x150 center crop. Create a NEW premium cute 16-bit pixel art game illustration with a large happy cocoa-brown mole popping out of a stepped oval earth burrow in a tiny mint-and-sage grassy garden. Mole has round chubby head, small ears, glossy black pixel eyes, tiny dusty pink nose, cream muzzle and tummy, rosy cheeks, tiny smiling mouth, small raised paws, three-pixel hair tuft. Smaller mole peeking from another hole at lower right. A friendly toy wooden mallet angled at upper right and a few cream pixel sparkles suggest gameplay without striking anyone. Warm cream sky, tiny pixel clouds, very sparse ivory daisies and grass sprigs. Central main mole is the clear focal point and sits within central 60 percent width and middle 65 percent height, with generous breathing space at corners for UI badges. Refined restrained warm earthy brown, pale sage, ivory palette. Actual crisp pixel clusters, visibly square pixels, stepped silhouettes, 2-3 shade ramps, no antialiasing, no blur, no smooth vector edges, no realistic textures, no 3D rendering. Full bleed opaque background. No text, letters, logos, watermark, frame, or UI.

## 다른색 찾기 커버 생성 프롬프트

Use case: stylized-concept. Asset type: landscape 3:2 cover illustration for a find-the-different-color puzzle mini game. Create a NEW beautiful playful 16-bit pixel art cover, matching a premium cozy pixel arcade collection. Central subject is a neatly front-facing 3 by 3 grid of chunky pixel-edged square tiles, all eight tiles soft indigo/periwinkle and exactly one center-right tile noticeably lighter lavender, resting on a small cream pixel-bordered puzzle board. A large pixel-art magnifying glass diagonally overlaps at lower-right, its glass clearly revealing the lighter tile, with a warm cream handle and dark indigo stepped outline. A few small pixel diamond sparkles emphasize discovery. Light lavender/off-white background, sparse decorative small pixel squares at distant edges. Carefully composed, polished, cute and legible at thumbnail size, central motif within central 60 percent width and middle 65 percent height for 300x150 center crop, generous empty corners for interface badges. Restrained indigo, periwinkle, lavender and cream palette, no rainbow colors. Authentic crisp square pixel clusters, dark indigo stepped outlines, flat 2-3 shade ramps, no antialiasing, no smooth curves, no gradients, no 3D render, no blur. Full bleed opaque backdrop. No text, letters, numbers, logos, watermark, frame, or UI.
