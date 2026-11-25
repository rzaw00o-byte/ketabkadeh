import json

import boto3
import pytest
from botocore.exceptions import ClientError
from botocore.stub import Stubber

from scripts.create_bucket import ensure_bucket, ensure_public_read, public_read_policy


@pytest.fixture
def s3():
    client = boto3.client(
        "s3",
        region_name="us-east-1",
        aws_access_key_id="a",
        aws_secret_access_key="b",
        endpoint_url="http://localhost:9000",
    )
    with Stubber(client) as stubber:
        yield client, stubber
        stubber.assert_no_pending_responses()


def test_missing_bucket_is_created(s3):
    client, stubber = s3
    stubber.add_client_error("head_bucket", service_error_code="404", http_status_code=404)
    stubber.add_response("create_bucket", {}, {"Bucket": "ketabkadeh"})
    assert ensure_bucket(client, "ketabkadeh") is True


def test_existing_bucket_is_left_alone(s3):
    client, stubber = s3
    stubber.add_response("head_bucket", {}, {"Bucket": "ketabkadeh"})
    assert ensure_bucket(client, "ketabkadeh") is False


def test_other_errors_are_raised(s3):
    client, stubber = s3
    stubber.add_client_error("head_bucket", service_error_code="403", http_status_code=403)
    with pytest.raises(ClientError):
        ensure_bucket(client, "ketabkadeh")


def test_public_policy_exposes_only_covers_and_authors():
    policy = json.loads(public_read_policy("ketabkadeh"))
    resources = policy["Statement"][0]["Resource"]
    assert resources == [
        "arn:aws:s3:::ketabkadeh/covers/*",
        "arn:aws:s3:::ketabkadeh/authors/*",
    ]
    assert not any("ebooks" in r for r in resources)


def test_public_read_policy_is_applied(s3):
    client, stubber = s3
    stubber.add_response(
        "put_bucket_policy",
        {},
        {"Bucket": "ketabkadeh", "Policy": public_read_policy("ketabkadeh")},
    )
    ensure_public_read(client, "ketabkadeh")
