"""pytest plugin that streams results to TestForge.

Creates a run at session start, posts each test result as it finishes, and
completes the run at session end. Tests are matched to cases by a
``TC-<SLUG>-<n>`` id in the test node id (e.g. a test named
``test_TC_WEB_001_login`` or parametrized with ``TC-WEB-001``).

Config via env: TESTFORGE_URL, TESTFORGE_TOKEN, TESTFORGE_PROJECT,
TESTFORGE_RUN_NAME. Missing config = the plugin no-ops (never fails the run).
"""

from __future__ import annotations

import datetime
import os

from .client import TestForgeClient

# pytest outcome -> TestForge status.
_STATUS = {"passed": "PASSED", "failed": "FAILED", "skipped": "SKIPPED"}


class _TestForgePlugin:
    def __init__(self, client: TestForgeClient, run_name: str) -> None:
        self.client = client
        self.run_name = run_name
        self.enabled = True
        self.posted = 0
        self.unmatched = 0

    def pytest_sessionstart(self, session) -> None:  # noqa: ARG002
        try:
            self.client.load_case_map()
            origin = "CI · pytest" if os.environ.get("CI") else "Local · pytest"
            self.client.create_run(self.run_name, source="PYTEST", origin=origin)
        except Exception as exc:  # pragma: no cover - network failure path
            self.enabled = False
            print(f"[testforge] could not start run: {exc}")

    def pytest_runtest_logreport(self, report) -> None:
        if not self.enabled:
            return
        # Post once per test: the "call" phase for pass/fail, the "setup" phase
        # for skips (which never reach "call").
        is_skip = report.when == "setup" and report.outcome == "skipped"
        if report.when != "call" and not is_skip:
            return
        case_id = self.client.resolve_case_id(report.nodeid)
        if not case_id:
            self.unmatched += 1
            return
        comment = report.longreprtext if report.outcome == "failed" else None
        try:
            self.client.post_result(
                case_id,
                _STATUS.get(report.outcome, "FAILED"),
                comment=comment,
                elapsed_seconds=int(report.duration or 0),
            )
            self.posted += 1
        except Exception as exc:  # pragma: no cover
            print(f"[testforge] result post failed: {exc}")

    def pytest_sessionfinish(self, session, exitstatus) -> None:  # noqa: ARG002
        if not self.enabled:
            return
        try:
            self.client.complete_run()
            extra = (
                f", {self.unmatched} test(s) without a TC-id" if self.unmatched else ""
            )
            print(f"[testforge] run completed — {self.posted} result(s) posted{extra}")
        except Exception as exc:  # pragma: no cover
            print(f"[testforge] could not complete run: {exc}")


def pytest_configure(config) -> None:
    client = TestForgeClient(
        url=os.environ.get("TESTFORGE_URL", ""),
        token=os.environ.get("TESTFORGE_TOKEN", ""),
        project=os.environ.get("TESTFORGE_PROJECT", ""),
    )
    if not client.configured:
        # Silent unless the user clearly meant to enable it.
        if os.environ.get("TESTFORGE_URL") or os.environ.get("TESTFORGE_TOKEN"):
            print("[testforge] not configured (need url, token, project) — skipping.")
        return
    run_name = os.environ.get("TESTFORGE_RUN_NAME") or (
        f"pytest {datetime.datetime.now().isoformat(timespec='seconds')}"
    )
    config.pluginmanager.register(_TestForgePlugin(client, run_name), "testforge")
