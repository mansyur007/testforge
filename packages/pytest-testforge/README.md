# pytest-testforge

A [pytest](https://pytest.org) plugin that streams results to
[TestForge](https://github.com/mansyur007/test-forge): it opens a run at session
start, posts each test result as it finishes, and completes the run at the end.

Zero dependencies — uses only the Python standard library.

## Install

```bash
pip install pytest-testforge
```

Requires Python 3.8+.

## Configure

The plugin auto-registers with pytest. Enable it by setting the connection env
vars:

| Env | Description |
| --- | --- |
| `TESTFORGE_URL` | TestForge base URL |
| `TESTFORGE_TOKEN` | WRITE-scoped API key |
| `TESTFORGE_PROJECT` | Project slug |
| `TESTFORGE_RUN_NAME` | Run name (default: `pytest <timestamp>`) |

If URL / token / project aren't all set, the plugin does nothing — it never
fails your test run.

## Matching tests to cases

Put a `TC-<SLUG>-<n>` id anywhere in the test node id — the function name or a
parametrization id both work:

```python
def test_TC_WEB_001_valid_login():
    ...

@pytest.mark.parametrize("case", ["TC-WEB-002"])
def test_login_variants(case):
    ...
```

Outcomes map as: `passed → PASSED`, `skipped → SKIPPED`, `failed → FAILED`. The
failure traceback (truncated to 5000 chars) is stored as the result comment.

## Run

```bash
TESTFORGE_URL=https://testforge.example.com \
TESTFORGE_TOKEN=tf_xxx \
TESTFORGE_PROJECT=web \
pytest
```

## License

MIT
