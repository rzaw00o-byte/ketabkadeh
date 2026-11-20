"""ساخت bucket در MinIO (یا هر ذخیره‌ساز سازگار با S3) اگر وجود نداشته باشد.

قبل از بالا آمدن Django اجرا می‌شود و تا آماده شدن سرویس ذخیره‌ساز تلاش مجدد می‌کند.
"""

import os
import sys
import time

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError

MISSING_CODES = ("404", "NoSuchBucket", "NotFound")


def make_client():
    return boto3.client(
        "s3",
        endpoint_url=f"http://{os.environ.get('MINIO_ENDPOINT', 'minio:9000')}",
        aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
        aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
        region_name="us-east-1",
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def ensure_bucket(client, bucket):
    """اگر bucket ساخته شد True، اگر از قبل بود False برمی‌گرداند."""
    try:
        client.head_bucket(Bucket=bucket)
        return False
    except ClientError as error:
        if error.response["Error"]["Code"] not in MISSING_CODES:
            raise
    client.create_bucket(Bucket=bucket)
    return True


def main(retries=30, delay=2):
    bucket = os.environ.get("MINIO_BUCKET", "ketabkadeh")
    client = make_client()
    for attempt in range(1, retries + 1):
        try:
            created = ensure_bucket(client, bucket)
        except (BotoCoreError, ClientError) as error:
            print(f"[{attempt}/{retries}] ذخیره‌ساز هنوز آماده نیست: {error}", flush=True)
            time.sleep(delay)
        else:
            print(f"bucket «{bucket}» {'ساخته شد' if created else 'از قبل وجود داشت'}.")
            return 0
    print("ساخت bucket ناموفق بود.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
