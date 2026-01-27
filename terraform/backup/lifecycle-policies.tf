resource "aws_s3_bucket_lifecycle_configuration" "backup_lifecycle" {
  provider = aws.primary
  bucket   = aws_s3_bucket.backup_primary.id

  rule {
    id     = "TransitionToIA"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "dr_lifecycle" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backup_dr.id

  rule {
    id     = "TransitionToGlacier"
    status = "Enabled"

    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}
