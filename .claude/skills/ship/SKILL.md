---
name: ship
description: Ship AccountThai ขึ้น production — รัน `scripts/deploy.sh ship` ซึ่ง pull --rebase origin/main, รัน gates (tsc + next build), อัปเดต Turso schema ด้วย drizzle-kit push ถ้า schema.ts เปลี่ยน, commit, push แล้วเปิด+merge PR เข้า main (Vercel git integration deploy production อัตโนมัติ), รอจน production Ready แล้วบันทึก docs/DEPLOYS.md ทำเฉพาะที่จำเป็นและรายงานว่าทำ/ข้ามอะไร Trigger เมื่อ /ship หรือผู้ใช้พูดว่า "ship", "ship it", "ปล่อยขึ้น prod", "อัพขึ้นจริง", "deploy", "release", "ปล่อยจริง", "merge แล้วปล่อยเลย" ถ้าจะเตรียมของโดยยังไม่ปล่อย ("ยังไม่ปล่อย", "รอเทสต์ก่อน") ใช้โหมด sync แทน ALWAYS รัน check pass และรายงานแผนก่อนแตะ prod
---

# Ship

Pull แล้วปล่อยขึ้น production จบในคำสั่งเดียว กลไกอยู่ใน `scripts/deploy.sh` ส่วนการตัดสินใจ (อะไรกำลังจะขึ้น, ข้อความ commit, สรุปผล) อยู่ที่นี่ script เป็น **idempotent** — ทำเฉพาะชั้นที่จำเป็นและรายงานสิ่งที่ทำ vs ข้าม

โหมดพี่น้อง: **`scripts/deploy.sh sync`** ทำแค่ pull + typecheck แล้วหยุดก่อน commit/push/deploy — ใช้เตรียมของไว้เทสต์ก่อน `/ship` คือ sync + ปล่อยจริง

สถาปัตยกรรม: **DB** = Turso (sync schema ด้วย `drizzle-kit push` — ไม่มีไฟล์ migration); **Web** = Vercel project `accountthai` ผูก git ไว้ — push branch ได้ Preview, merge เข้า `main` = deploy **Production** อัตโนมัติ; workflow ปกติ = feature branch `claude/*` → PR → merge

## ทำตามลำดับนี้

### 1. ดูแผนก่อนเสมอ — ห้ามข้าม check pass
```
scripts/deploy.sh check
```
ไม่แก้อะไรเลย รายงาน: branch, ไฟล์ค้าง commit/untracked, ahead/behind origin/main, typecheck, schema เปลี่ยนหรือไม่ และแผนว่า ship จะทำอะไร **เล่าแผนให้ผู้ใช้ฟังเป็นภาษาไทย** ถ้า typecheck แดง หยุดแล้วแก้ก่อน — อย่า ship ข้ามมัน

### 2. ตรวจของที่กำลังจะขึ้น — แล้วจัดการเอง 2 อย่างที่ script ทำให้ไม่ได้
- **ไฟล์ untracked**: script จะ commit เฉพาะไฟล์ tracked (`git add -u`) — ไฟล์ใหม่ต้อง `git add <path>` เองก่อน ระวังอย่า add ไฟล์ลับ (`.env*`, `ตัวอย่างเอกสาร/` อยู่ใน .gitignore แล้ว แต่เช็คซ้ำ)
- **schema เปลี่ยนแบบ destructive**: ถ้า `src/db/schema.ts` มีการลบ/เปลี่ยนชนิดคอลัมน์ `drizzle-kit push` อาจถามยืนยันหรือทำข้อมูลหาย — เปิด diff ดูเองก่อน (`git diff origin/main -- src/db/schema.ts`) ถ้าเป็นแค่เพิ่มตาราง/คอลัมน์ ปล่อยให้ script รันได้เลย

ดู commit ที่จะติดไปกับ ship ด้วย ไม่ใช่แค่ที่เราแก้เอง:
```
git log --oneline origin/main..HEAD
```

### 3. Ship
```
COMMIT_MSG="ข้อความ commit ตรงกับ diff" scripts/deploy.sh ship --yes
```
รันเฉพาะที่จำเป็น: pull --rebase → typecheck → build → db:push (ถ้า schema เปลี่ยน — **ก่อน**โค้ดขึ้น prod เสมอ) → commit → push → เปิด/merge PR เข้า main → รอ production deployment Ready (poll `vercel ls`) → บันทึก `docs/DEPLOYS.md` ถ้าอยู่บน `main` อยู่แล้วจะ push ตรงโดยไม่เปิด PR

### 4. รายงานผล — **ตอบกลับเป็นภาษาไทยเสมอ**
สรุปให้ผู้ใช้: อะไรขึ้น prod จริง vs ถูกข้าม, commit sha / PR number, schema push หรือไม่, URL production ที่ Ready แล้ว และทุกอย่างที่ script `warn` ไว้ (ศัพท์เทคนิค/SHA/path เป็นอังกฤษได้ คำอธิบายเป็นไทย)

## กฎ
- **Check ก่อน ship ทุกครั้ง** — กัน drift (เช่น schema ที่ยังไม่ push ทำให้โค้ดใหม่พังบน prod)
- **DB ก่อนโค้ดเสมอ** — script บังคับลำดับ db:push → merge ให้แล้ว อย่า merge เองข้าม script
- **อย่ารันขั้นตอนย่อยเองแทน script** — นั่นคือสาเหตุที่ขั้นตอนหล่นหาย ลงมือ manual เฉพาะตอน script ล้มแล้วบอกสาเหตุที่มันแก้เองไม่ได้
- **ห้าม commit ไฟล์ลับ** — `.env.vercel.prod` และ `ตัวอย่างเอกสาร/` ถูก ignore แล้ว ถ้าเจอไฟล์ลับใหม่ใน untracked ให้เพิ่ม .gitignore ก่อน
- merge PR ใช้ `--merge` (merge commit) ตามสไตล์ประวัติ repo นี้
- Preview deployment (จาก push branch) **ไม่ใช่** production — production คือ deployment ที่เกิดหลัง merge เข้า main เท่านั้น
- ถ้าผู้ใช้ต้องการเตรียมของแต่ยังไม่ปล่อย ("ยังไม่ปล่อย", "รอเทสต์ก่อน") → ใช้ `scripts/deploy.sh sync` ไม่ใช่ ship
- `npm run lint` (`next lint`) ใช้ไม่ได้บน Next 16 — gate คือ tsc + next build (ถ้าจะมี lint ต้อง migrate ไป ESLint CLI ก่อน)
