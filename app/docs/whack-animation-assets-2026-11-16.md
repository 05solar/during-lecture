# 망치·피격 표정 생성 기록

내장 `image_gen`으로 생성하고, WebP 인코딩(품질 0.94)과 최근접 축소를 적용했다. 투명 알파를 유지했다.

- `src/pages/WhackGame/assets/hammer.webp` (256×256): 새로 생성한 망치.
- `src/pages/WhackGame/assets/mole-hit.webp` (320×320): 기존 `mole.webp`를 참조해 표정만 수정.

## hammer

Use case: stylized-concept. Asset type: transparent game sprite for a cute 16-bit pixel-art whack-a-mole game. A single adorable wooden toy mallet, upright with handle pointing down and hammer head horizontal at the TOP, slight three-quarter view to see the flat striking left face. Warm honey wood, cream highlight, cocoa brown stepped outline, a small muted indigo band on the handle. Chunky square pixel clusters, clean flat 3-tone shading, authentic 32x32 to 64x64 pixel-art appearance, crisp square edges. The head is wide and soft looking, no dangerous spikes, no realism, no 3D textures. Entire object centered with 12 percent empty margin on a square canvas. No character, no hand, no motion lines, no shadow, no letters, no logo. Truly transparent alpha background. The bottom handle end is the pivot for a CSS swinging animation.

## moleHit

Use case: precise-object-edit. Edit target: the provided transparent pixel-art mole sprite. Preserve EXACT character identity, proportions, canvas framing, brown and cream color palette, black outline, hair tuft, ears, belly and paw positions, and its transparent alpha background. Change only the facial expression: eyes close into cute sideways squeezed chevrons (> <), pink blush remains, mouth becomes a tiny surprised round o. This is a playful cartoon bonk reaction for a whack-a-mole game, adorable and unharmed. Keep character upright and the same scale so it can swap with the original without jumping. Do not add stars or effects, do not add hammer, no injuries, no text, no ground, no background. Keep crisp chunky 16-bit pixel-art style.

