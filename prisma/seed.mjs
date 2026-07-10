// Seed data demo — gap audit: PRD tidak menyebut onboarding/sample data,
// padahal penting untuk first-run experience produk open source.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const existing = await db.user.findUnique({
    where: { email: "admin@testforge.local" },
  });
  if (existing) {
    console.log("Seed sudah pernah dijalankan, skip.");
    return;
  }

  const admin = await db.user.create({
    data: {
      name: "Admin TestForge",
      email: "admin@testforge.local",
      passwordHash: await bcrypt.hash("admin12345", 10),
      role: "ADMIN",
    },
  });

  const project = await db.project.create({
    data: {
      name: "Web Portal (Demo)",
      slug: "web",
      description: "Proyek demo bawaan — silakan dihapus atau diarsipkan.",
      createdById: admin.id,
      members: { create: { userId: admin.id, role: "OWNER" } },
    },
  });

  const authSuite = await db.testSuite.create({
    data: { projectId: project.id, name: "Authentication", order: 0 },
  });
  const loginSection = await db.testSuite.create({
    data: {
      projectId: project.id,
      parentId: authSuite.id,
      name: "Login",
      order: 0,
    },
  });
  const checkoutSuite = await db.testSuite.create({
    data: { projectId: project.id, name: "Checkout", order: 1 },
  });

  const cases = [
    {
      suiteId: loginSection.id,
      title: "Valid login dengan email terdaftar",
      priority: "CRITICAL",
      type: "SMOKE",
      automationStatus: "AUTOMATED",
      tags: "smoke,login",
      preconditions: "User dengan email valid sudah terdaftar dan aktif",
      steps: [
        { action: "Buka halaman /login", expected: "Form login tampil" },
        { action: "Input email terdaftar", expected: "" },
        { action: "Input password yang benar", expected: "" },
        { action: "Klik tombol Login", expected: "Redirect ke dashboard" },
      ],
      expectedResult: "User berhasil masuk dan melihat dashboard",
    },
    {
      suiteId: loginSection.id,
      title: "Login gagal dengan password salah",
      priority: "HIGH",
      type: "FUNCTIONAL",
      automationStatus: "AUTOMATED",
      tags: "login,negative",
      steps: [
        { action: "Buka halaman /login", expected: "" },
        { action: "Input email terdaftar + password salah", expected: "" },
        { action: "Klik Login", expected: "Pesan error muncul" },
      ],
      expectedResult: "Error ditampilkan, tidak ada session terbentuk",
    },
    {
      suiteId: loginSection.id,
      title: "Lockout setelah 5 kali gagal login",
      priority: "HIGH",
      type: "SECURITY",
      automationStatus: "NOT_AUTOMATED",
      tags: "security,login",
      steps: [
        { action: "Gagal login 5 kali berturut-turut", expected: "" },
        { action: "Coba login dengan kredensial benar", expected: "Akses ditolak sementara" },
      ],
      expectedResult: "Akun terkunci 5 menit (brute force protection)",
    },
    {
      suiteId: checkoutSuite.id,
      title: "Checkout dengan kartu kredit valid",
      priority: "CRITICAL",
      type: "E2E",
      automationStatus: "IN_PROGRESS",
      tags: "checkout,payment",
      steps: [
        { action: "Tambahkan produk ke cart", expected: "" },
        { action: "Lanjut ke checkout", expected: "" },
        { action: "Isi data kartu valid dan submit", expected: "Pembayaran sukses" },
      ],
      expectedResult: "Order terbentuk dengan status PAID",
    },
    {
      suiteId: checkoutSuite.id,
      title: "Validasi stok habis saat checkout",
      priority: "MEDIUM",
      type: "REGRESSION",
      automationStatus: "NOT_AUTOMATED",
      tags: "checkout,negative",
      steps: [
        { action: "Tambahkan produk dengan stok 0", expected: "Pesan stok habis" },
      ],
      expectedResult: "Checkout diblokir dengan pesan jelas",
    },
  ];

  let seq = 0;
  const created = [];
  for (const c of cases) {
    seq++;
    created.push(
      await db.testCase.create({
        data: {
          projectId: project.id,
          suiteId: c.suiteId,
          seq,
          title: c.title,
          priority: c.priority,
          type: c.type,
          automationStatus: c.automationStatus,
          tags: c.tags,
          preconditions: c.preconditions ?? null,
          stepsJson: JSON.stringify(c.steps),
          expectedResult: c.expectedResult,
        },
      })
    );
  }
  await db.project.update({
    where: { id: project.id },
    data: { caseCounter: seq },
  });

  // F-05: baseline revision per case + one edit on the first case so the
  // History tab has a diff to show. Snapshot shape mirrors lib/case-revisions.
  const snapshotOf = (c) => ({
    title: c.title,
    description: c.description ?? null,
    preconditions: c.preconditions ?? null,
    steps: JSON.parse(c.stepsJson || "[]"),
    expectedResult: c.expectedResult ?? null,
    priority: c.priority,
    type: c.type,
    status: c.status,
    automationStatus: c.automationStatus,
    tags: c.tags,
    suiteId: c.suiteId ?? null,
    assigneeId: c.assigneeId ?? null,
    linkedIssues: c.linkedIssues ?? null,
    custom: JSON.parse(c.customJson || "{}"),
  });
  for (const c of created) {
    await db.testCaseRevision.create({
      data: {
        caseId: c.id,
        rev: 1,
        authorId: admin.id,
        snapshotJson: JSON.stringify(snapshotOf(c)),
        changeSummary: "created",
      },
    });
  }
  const edited = await db.testCase.update({
    where: { id: created[0].id },
    data: { title: `${created[0].title} (v2)`, priority: "CRITICAL", rev: 2 },
  });
  await db.testCaseRevision.create({
    data: {
      caseId: edited.id,
      rev: 2,
      authorId: admin.id,
      snapshotJson: JSON.stringify(snapshotOf(edited)),
      changeSummary: "title, priority",
    },
  });

  const milestone = await db.milestone.create({
    data: { projectId: project.id, name: "Release v1.0" },
  });

  await db.testRun.create({
    data: {
      projectId: project.id,
      name: "Smoke Test Sprint 1",
      milestoneId: milestone.id,
      createdById: admin.id,
      results: {
        create: [
          // caseRev 1 while the case is at rev 2 → demo of the stale-rev chip.
          { caseId: created[0].id, status: "PASSED", elapsedSeconds: 42, caseRev: 1 },
          { caseId: created[1].id, status: "PASSED", elapsedSeconds: 30, caseRev: 1 },
          {
            caseId: created[2].id,
            status: "FAILED",
            comment: "Lockout tidak aktif setelah 5 percobaan",
            defectUrl: "https://github.com/example/repo/issues/12",
            caseRev: 1,
          },
          { caseId: created[3].id, status: "UNTESTED", caseRev: 1 },
          { caseId: created[4].id, status: "UNTESTED", caseRev: 1 },
        ],
      },
    },
  });

  console.log("Seed selesai: admin@testforge.local / admin12345");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
