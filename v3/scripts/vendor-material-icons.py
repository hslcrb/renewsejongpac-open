#!/usr/bin/env python3
"""Vendor the complete Rounded set and build the site's small SVG sprite."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
from urllib.request import urlopen
import xml.etree.ElementTree as ET

VERSION = "0.48.0"
URL = f"https://registry.npmjs.org/@material-symbols/svg-400/-/svg-400-{VERSION}.tgz"
INTEGRITY = "W20MjbiDbLJQ5yi4CPz2y6lCZ9bk3pJ1d5Ra+uErvtj/guVrCNfcYyMZn3KqHpDyyKVfBGkuGHVcdi5h+5+EqA=="
DEST = Path(__file__).resolve().parents[1] / "assets/icons"
SYMBOLS = [
    "arrow_forward", "arrow_back", "arrow_outward", "arrow_upward", "search", "menu", "close",
    "calendar_month", "location_on", "confirmation_number", "person", "favorite",
    "favorite-fill", "chevron_right", "schedule", "add", "check", "accessible",
    "directions_car", "apartment", "local_cafe", "mail", "download", "play_arrow", "pause",
]


def main():
    with urlopen(URL, timeout=60) as response:
        archive = response.read()
    actual = base64.b64encode(hashlib.sha512(archive).digest()).decode()
    if actual != INTEGRITY:
        raise RuntimeError("SVG archive integrity check failed")

    rounded = DEST / "rounded"
    rounded.mkdir(parents=True, exist_ok=True)
    files = []
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as package:
        for member in package:
            path = Path(member.name)
            if member.isfile() and path.parent.as_posix() == "package/rounded" and path.suffix == ".svg":
                content = package.extractfile(member).read()
                ET.fromstring(content)  # Reject invalid SVGs before writing.
                (rounded / path.name).write_bytes(content)
                files.append(path.stem)
        (DEST / "LICENSE").write_bytes(package.extractfile("package/LICENSE").read())

    namespace = "http://www.w3.org/2000/svg"
    ET.register_namespace("", namespace)
    sprite = ET.Element(f"{{{namespace}}}svg")
    for name in SYMBOLS:
        source = ET.fromstring((rounded / f"{name}.svg").read_bytes())
        symbol = ET.SubElement(sprite, f"{{{namespace}}}symbol", id=name, viewBox=source.attrib["viewBox"])
        symbol.extend(source)
    (DEST / "material-symbols-rounded.svg").write_text(ET.tostring(sprite, encoding="unicode") + "\n")
    (DEST / "catalog.json").write_text(json.dumps({
        "package": "@material-symbols/svg-400", "version": VERSION,
        "style": "rounded", "weight": 400, "grade": 0, "opticalSize": 48,
        "integrity": "sha512-" + INTEGRITY, "files": sorted(files),
    }, indent=2) + "\n")
    print(f"Verified and saved {len(files)} Rounded SVGs; sprite contains {len(SYMBOLS)} symbols.")


if __name__ == "__main__":
    main()
