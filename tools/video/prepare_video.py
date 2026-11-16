"""Check media and prepare section timings. Does not render, edit or speed up media."""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path


def read_manifest(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    sections = data.get("sections", [])
    if data.get("version") != 1 or not sections:
        raise ValueError("El proyecto necesita version 1 y al menos una sección.")
    ids = [s.get("id") for s in sections]
    if any(not isinstance(i, str) or not i for i in ids) or len(set(ids)) != len(ids):
        raise ValueError("Cada sección necesita un id único.")
    limit = data.get("max_seconds", 600)
    if not isinstance(limit, (int, float)) or not math.isfinite(limit) or limit <= 0:
        raise ValueError("max_seconds debe ser positivo.")
    for section in sections:
        if not isinstance(section.get("audio"), str) or not section["audio"]:
            raise ValueError(f"Falta el audio de la sección {section['id']}.")
        visuals = section.get("visuals", [])
        if not isinstance(visuals, list) or not visuals or any(not isinstance(v, str) or not v for v in visuals):
            raise ValueError(f"Indica al menos un visual para la sección {section['id']}.")
    return data


def media_path(manifest: Path, value: str) -> Path:
    return (manifest.parent / value).resolve()


def missing_media(manifest: Path, data: dict) -> list[str]:
    return [str(media_path(manifest, value)) for section in data["sections"]
            for value in [section["audio"], *section["visuals"]]
            if not media_path(manifest, value).is_file()]


def audio_seconds(path: Path, ffprobe: str) -> float:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, check=True, timeout=60,
    )
    seconds = float(json.loads(result.stdout)["format"]["duration"])
    if not math.isfinite(seconds) or seconds <= 0:
        raise ValueError(f"Duración de audio inválida: {path.name}")
    return seconds


def timing_plan(manifest: Path, data: dict, probe) -> dict:
    current = 0.0
    sections = []
    for section in data["sections"]:
        duration = probe(media_path(manifest, section["audio"]))
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError("Las duraciones deben ser positivas y finitas.")
        sections.append({**section, "start_seconds": round(current, 3),
                         "duration_seconds": round(duration, 3),
                         "end_seconds": round(current + duration, 3)})
        current += duration
    return {"version": 1, "total_seconds": round(current, 3),
            "within_limit": current <= data.get("max_seconds", 600),
            "max_seconds": data.get("max_seconds", 600), "sections": sections,
            "status": "Preparación; distribución de visuales y montaje pendientes de instrucciones"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Comprueba los materiales del video de CamVision; no genera un video.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--plan", type=Path, help="Escribir tiempos reales de audio en un archivo JSON nuevo.")
    parser.add_argument("--ffprobe", help="Ruta al ejecutable ffprobe si no está en PATH.")
    args = parser.parse_args()
    manifest = args.manifest.resolve()
    data = read_manifest(manifest)
    missing = missing_media(manifest, data)
    if missing:
        print("Todavía faltan materiales:")
        for path in missing:
            print(" -", path)
        return 2
    print(f"Materiales encontrados: {len(data['sections'])} secciones.")
    if not args.plan:
        print("No se modificaron audios, clips ni imágenes.")
        return 0
    ffprobe = args.ffprobe or shutil.which("ffprobe")
    if not ffprobe:
        raise ValueError("Para medir audio se necesita ffprobe en PATH o --ffprobe RUTA.")
    plan = timing_plan(manifest, data, lambda p: audio_seconds(p, ffprobe))
    args.plan.parent.mkdir(parents=True, exist_ok=True)
    with args.plan.open("x", encoding="utf-8") as target:
        json.dump(plan, target, ensure_ascii=False, indent=2)
    print(f"Duración de audio total: {plan['total_seconds']:.1f} s; límite {plan['max_seconds']} s.")
    if not plan["within_limit"]:
        print("Supera el límite: revisar el montaje antes de generar el video. No se aceleró ni recortó audio.")
        return 3
    print("Plan de tiempos preparado. No se generó un video.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, KeyError, subprocess.SubprocessError) as error:
        print(f"No se pudo preparar el montaje: {error}")
        raise SystemExit(1)
