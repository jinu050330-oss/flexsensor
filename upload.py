import argparse
import logging
import math
from pathlib import Path

import serial
from dotenv import load_dotenv
from supabase import Client, create_client


logger = logging.getLogger("upload")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read Arduino values from a serial port and insert them into Supabase."
    )
    parser.add_argument(
        "--port",
        default="COM9",
        help="Arduino serial port (default: COM9)",
    )
    parser.add_argument(
        "--baud",
        type=int,
        default=9600,
        help="Serial baud rate (default: 9600)",
    )
    return parser.parse_args()


def create_supabase_client() -> Client:
    load_dotenv(Path(__file__).resolve().with_name(".env"))

    import os

    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError(
            "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the project .env file."
        )

    return create_client(url, key)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    args = parse_args()

    try:
        supabase = create_supabase_client()
    except Exception as error:
        raise SystemExit(f"Supabase configuration error: {error}") from error

    try:
        with serial.Serial(args.port, args.baud, timeout=1) as arduino:
            logger.info("Connected to %s at %s baud; press Ctrl+C to stop.", args.port, args.baud)
            while True:
                raw_line = arduino.readline()
                if not raw_line:
                    continue

                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    value = float(line)
                except ValueError:
                    logger.warning("Skipping non-numeric serial line: %r", line)
                    continue

                if not math.isfinite(value):
                    logger.warning("Skipping non-finite serial value: %r", line)
                    continue

                try:
                    supabase.table("readings").insert({"value": value}).execute()
                except Exception as error:
                    if getattr(error, "code", None) == "42501":
                        raise SystemExit(
                            "Supabase blocked the insert with RLS. Add an INSERT policy for role 'anon' on public.readings."
                        ) from error
                    raise SystemExit(f"Supabase insert failed: {error}") from error

                logger.info("Inserted value: %s", value)
    except serial.SerialException as error:
        raise SystemExit(f"Could not open/read serial port {args.port}: {error}") from error
    except KeyboardInterrupt:
        logger.info("Stopped by user.")


if __name__ == "__main__":
    main()