import pytest
from ingest import sanitize_text, extract_text_from_url
# Mocking request for URL test would be ideal, but for MVP manual test script is fine.

def test_sanitize():
    raw = "Hello   World\n\nTest"
    clean = sanitize_text(raw)
    assert clean == "Hello World Test"

if __name__ == "__main__":
    test_sanitize()
    print("Sanitize Test Passed")
