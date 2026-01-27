# Primary Backup Bucket (US-East-1)
resource "aws_s3_bucket" "backup_primary" {
  provider = aws.primary
  bucket   = "agencyos-backups-primary-us-east-1"

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "backup_primary_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.backup_primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_primary_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.backup_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Object Lock for Compliance (WORM)
resource "aws_s3_bucket_object_lock_configuration" "backup_primary_lock" {
  provider = aws.primary
  bucket   = aws_s3_bucket.backup_primary.id
  object_lock_enabled = "Enabled"

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}

# DR Backup Bucket (EU-West-1)
resource "aws_s3_bucket" "backup_dr" {
  provider = aws.dr
  bucket   = "agencyos-backups-dr-eu-west-1"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "backup_dr_versioning" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backup_dr.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_dr_encryption" {
  provider = aws.dr
  bucket   = aws_s3_bucket.backup_dr.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Replication Configuration (Primary -> DR)
resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.primary
  bucket   = aws_s3_bucket.backup_primary.id
  role     = aws_iam_role.replication_role.arn

  rule {
    id     = "ReplicateToDR"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.backup_dr.arn
      storage_class = "STANDARD_IA"
    }
  }
}
