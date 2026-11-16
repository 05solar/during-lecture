# Go Game Guru: Hard collection

140 original SGF problems from **An Younggil and David Ormerod / Go Game Guru**.

- Upstream: https://github.com/gogameguru/go-problems
- Revision: `eee12b2e39d59dbe81a8b9eaa7d4f103978d9224`
- Directory: `weekly-go-problems/hard/`
- License: **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**.
- License link: https://creativecommons.org/licenses/by-nc-sa/4.0/
- Full license: [LICENSE.txt](LICENSE.txt).

The diagrams, move trees and English annotations are preserved. Only trailing whitespace/line endings were normalized while saving the files. No modern problem is attributed to a classical book. The authors' `Hard` category is displayed as `상급`; no independent dan rating is asserted.

Our generated topic labels and runtime tree representation are adaptations of this material and are shared under the same CC BY-NC-SA 4.0 license. They are separate from the application's UI and rules engine. The app displays author, source and license links and permits downloading the source SGF.

`validation.json` records the included files. `npm test` reparses all 140 files and replays every branch under the board's capture, suicide and simple-ko rules. All 19,880 nodes replay legally. 921 nodes have explicit source solution annotations. This validates import integrity and rule consistency, not an independent proof of every authored evaluation.

Grading uses the original explicit `Correct` / `TE[1]` annotations and their ancestors. A legal move absent from the tree is **ungraded**, never automatically declared a failed life-and-death result. Unmarked alternative branches remain available for review; the application does not invent their outcome. Review and free analysis preserve the full authored tree, including ko and seki discussions.
