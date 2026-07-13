"""Minimal TestForge REST client for the pytest plugin.

Uses only the standard library (urllib) so the plugin has zero dependencies.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

_TC_RE = re.compile(r"TC-[A-Za-z0-9]+-\d+")


class TestForgeClient:
    def __init__(self, url: str, token: str, project: str) -> None:
        self.url = (url or "").rstrip("/")
        self.token = token
        self.project = project
        self.case_map: dict[str, str] = {}
        self.run_id: str | None = None

    @property
    def configured(self) -> bool:
        return bool(self.url and self.token and self.project)

    def _request(self, path: str, method: str = "GET", body: dict | None = None) -> dict:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            f"{self.url}/api/v1{path}", data=data, method=method
        )
        req.add_header("Authorization", f"Bearer {self.token}")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read() or b"{}")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise RuntimeError(f"{method} {path}: HTTP {exc.code} {detail}") from exc

    def load_case_map(self) -> None:
        cursor = None
        while True:
            qs = "limit=200" + (f"&cursor={cursor}" if cursor else "")
            page = self._request(f"/projects/{self.project}/cases?{qs}")
            for case in page.get("data", []):
                display = case.get("displayId")
                if display:
                    self.case_map[display.upper()] = case["id"]
            cursor = page.get("nextCursor")
            if not cursor:
                break

    def resolve_case_id(self, text: str) -> str | None:
        match = _TC_RE.search(text or "")
        if not match:
            return None
        return self.case_map.get(match.group(0).upper())

    def create_run(self, name: str, source: str, origin: str | None = None) -> str:
        run = self._request(
            f"/projects/{self.project}/runs",
            method="POST",
            body={"name": name, "source": source, "origin": origin},
        )
        self.run_id = run["id"]
        return self.run_id

    def post_result(
        self,
        case_id: str,
        status: str,
        comment: str | None = None,
        elapsed_seconds: int | None = None,
    ) -> None:
        if not self.run_id:
            return
        body: dict = {"caseId": case_id, "status": status}
        if comment:
            body["comment"] = comment[:5000]
        if elapsed_seconds is not None:
            body["elapsedSeconds"] = elapsed_seconds
        self._request(
            f"/projects/{self.project}/runs/{self.run_id}/results",
            method="POST",
            body=body,
        )

    def complete_run(self) -> None:
        if not self.run_id:
            return
        self._request(
            f"/projects/{self.project}/runs/{self.run_id}",
            method="PATCH",
            body={"status": "COMPLETED"},
        )
