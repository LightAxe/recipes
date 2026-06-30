# inbox/ — private recipe-import source photos

Drop the ~80 source recipe photos here (any image format). **Everything in this folder
except this README is gitignored and never committed** — these are private family card
photos (handwriting, notes, possible EXIF/GPS) and the repo is public.

The `recipe-intake` agent reads each photo and **transcribes it into structured recipe
data** in `recipes/*.md` (researching gram weights along the way). The source photos stay
here, private. Hero images for the public site stay placeholder for now; publishing
scanned cards is a later, privacy-reviewed heritage phase (ADR-0004).

Suggested workflow:
1. Put photos in `inbox/` (e.g. `inbox/001.jpg` …).
2. In this worktree, ask Claude to run the `recipe-intake` agent over them.
3. Review the generated `recipes/*.md`, then commit the **data** (not the photos).
