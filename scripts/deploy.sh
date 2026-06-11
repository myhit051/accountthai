#!/usr/bin/env bash
# deploy.sh — เครื่องมือ ship ของ accountthai (idempotent: ทำเฉพาะที่จำเป็น รายงานสิ่งที่ทำ/ข้าม)
#
# โหมด:
#   check        ไม่แก้อะไรเลย — รายงานสถานะ + แผนว่า ship จะทำอะไรบ้าง
#   sync         pull --rebase --autostash origin/main + typecheck (เตรียมของ ไม่ push)
#   ship --yes   sync + build + db:push (ถ้า schema เปลี่ยน) + commit + push
#                + เปิด/merge PR เข้า main (Vercel deploy prod อัตโนมัติ) + verify + log
#
# env: COMMIT_MSG="..." ใช้เป็น commit message ตอน ship (จำเป็นเมื่อมีไฟล์ค้าง commit)
#
# สถาปัตยกรรม: DB = Turso (drizzle-kit push, ไม่มี migration files)
#              Web = Vercel git integration — push branch = Preview, merge เข้า main = Production
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-check}"
shift || true
YES=false
for arg in "$@"; do [[ "$arg" == "--yes" ]] && YES=true; done

say()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[fail]\033[0m %s\n' "$*"; exit 1; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
git fetch origin --quiet

status_report() {
  say "branch: $BRANCH"
  local dirty untracked behind_main ahead_main
  dirty=$(git status --porcelain --untracked-files=no | wc -l | tr -d ' ')
  untracked=$(git status --porcelain | grep -c '^??' || true)
  behind_main=$(git rev-list --count "HEAD..origin/main")
  ahead_main=$(git rev-list --count "origin/main..HEAD")
  [[ "$dirty" != "0" ]] && warn "มีไฟล์แก้ไขค้าง commit: $dirty ไฟล์" || ok "working tree สะอาด (ไฟล์ tracked)"
  [[ "$untracked" != "0" ]] && warn "มีไฟล์ untracked $untracked รายการ — script จะไม่ commit ให้ ต้อง git add เองถ้าต้องการ"
  say "เทียบกับ origin/main: ahead $ahead_main, behind $behind_main commits"
  if [[ "$ahead_main" != "0" ]]; then
    git log --oneline "origin/main..HEAD" | sed 's/^/    /'
  fi
  if schema_changed; then
    warn "src/db/schema.ts เปลี่ยนจาก origin/main — ship จะรัน drizzle-kit push ก่อน deploy โค้ด"
  fi
}

schema_changed() {
  ! git diff --quiet "origin/main...HEAD" -- src/db/schema.ts 2>/dev/null \
    || ! git diff --quiet -- src/db/schema.ts 2>/dev/null
}

typecheck() {
  say "typecheck (tsc --noEmit)…"
  npx tsc --noEmit && ok "typecheck ผ่าน" || fail "typecheck ไม่ผ่าน — แก้ก่อน ship"
}

pull_rebase() {
  if [[ "$(git rev-list --count "HEAD..origin/main")" == "0" ]]; then
    ok "ไม่มี commit ใหม่ใน origin/main — ข้าม pull"
  else
    say "pull --rebase --autostash origin main…"
    git pull --rebase --autostash origin main || fail "rebase มี conflict — แก้แล้วรันใหม่"
    ok "rebase ทับ origin/main แล้ว"
  fi
}

current_prod_url() {
  vercel ls --yes 2>/dev/null | awk '$6 == "Production" { print $3; exit }'
}

case "$MODE" in
  check)
    status_report
    typecheck
    say "แผนถ้า ship: pull → build → $(schema_changed && echo 'db:push → ' || true)commit → push → $([[ "$BRANCH" == "main" ]] && echo 'deploy prod' || echo 'PR → merge เข้า main → deploy prod') → verify"
    ;;

  sync)
    pull_rebase
    typecheck
    ok "sync เสร็จ — ยังไม่ push อะไร (พร้อมเทสต์ต่อ หรือสั่ง ship)"
    ;;

  ship)
    status_report
    if [[ "$YES" != "true" ]]; then
      fail "ship ต้องยืนยันด้วย --yes (รัน check เพื่อดูแผนก่อน)"
    fi

    pull_rebase
    typecheck

    say "build (next build)…"
    npm run build >/tmp/accountthai-build.log 2>&1 && ok "build ผ่าน" \
      || { tail -20 /tmp/accountthai-build.log; fail "build ไม่ผ่าน — ดู log ด้านบน"; }

    if schema_changed; then
      say "schema.ts เปลี่ยน → รัน drizzle-kit push (Turso)…"
      npm run db:push || fail "db:push ไม่สำเร็จ — ตรวจ schema/connection แล้วรันใหม่ (DB ต้องอัปเดตก่อนโค้ดขึ้น prod)"
      ok "schema อัปเดตเข้า Turso แล้ว"
    fi

    if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
      [[ -z "${COMMIT_MSG:-}" ]] && fail "มีไฟล์ค้าง commit แต่ไม่ได้ตั้ง COMMIT_MSG"
      git add -u
      git commit -m "$COMMIT_MSG" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
      ok "commit: $(git log -1 --format='%h %s')"
    else
      ok "ไม่มีอะไรต้อง commit"
    fi

    PROD_BEFORE=$(current_prod_url || true)

    if [[ "$BRANCH" == "main" ]]; then
      if [[ "$(git rev-list --count origin/main..HEAD)" == "0" ]]; then
        ok "main ตรงกับ origin แล้ว — ไม่มีอะไรต้อง push"; exit 0
      fi
      git push origin main
      ok "push main แล้ว → Vercel กำลัง deploy production"
    else
      git push -u origin "$BRANCH"
      ok "push branch แล้ว"
      PR_NUM=$(gh pr list --head "$BRANCH" --state open --json number -q '.[0].number' || true)
      if [[ -z "$PR_NUM" ]]; then
        say "ยังไม่มี PR — เปิดใหม่…"
        gh pr create --base main --head "$BRANCH" --fill
        PR_NUM=$(gh pr list --head "$BRANCH" --state open --json number -q '.[0].number')
      fi
      say "merge PR #$PR_NUM เข้า main…"
      gh pr merge "$PR_NUM" --merge || fail "merge PR ไม่สำเร็จ (conflict หรือ check แดง?)"
      ok "merge แล้ว → Vercel กำลัง deploy production"
    fi

    say "รอ production deployment ใหม่ (timeout 6 นาที)…"
    DEADLINE=$(( $(date +%s) + 360 ))
    while true; do
      ROW=$(vercel ls --yes 2>/dev/null | awk '$6 == "Production" { print $3" "$5; exit }' || true)
      URL=${ROW%% *}; STATE=${ROW##* }
      if [[ -n "$URL" && "$URL" != "$PROD_BEFORE" && "$STATE" == "Ready" ]]; then
        ok "production พร้อมแล้ว: $URL"; break
      fi
      [[ "$(date +%s)" -gt "$DEADLINE" ]] && { warn "ยังไม่เห็น deployment ใหม่ Ready ใน 6 นาที — เช็คเองที่ Vercel dashboard"; break; }
      sleep 15
    done

    {
      echo "- $(date '+%Y-%m-%d %H:%M') | $BRANCH | $(git log -1 --format='%h %s' origin/main 2>/dev/null || git log -1 --format='%h %s')"
    } >> docs/DEPLOYS.md 2>/dev/null || { mkdir -p docs; echo "# Deploy log" > docs/DEPLOYS.md; echo "- $(date '+%Y-%m-%d %H:%M') | $BRANCH | $(git log -1 --format='%h %s')" >> docs/DEPLOYS.md; }
    ok "บันทึก docs/DEPLOYS.md แล้ว (อยู่ในเครื่อง — จะติดไปกับ ship ครั้งถัดไป)"
    ;;

  *)
    fail "ไม่รู้จักโหมด '$MODE' — ใช้ check | sync | ship --yes"
    ;;
esac
