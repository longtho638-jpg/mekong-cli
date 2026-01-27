# AWS S3 Setup Guide

## 1. Create a Bucket

1.  Go to the [AWS S3 Console](https://s3.console.aws.amazon.com/s3/home).
2.  Click **Create bucket**.
3.  Enter a unique **Bucket name**.
4.  Select an **AWS Region** (e.g., `us-east-1`).
5.  Keep "Block all public access" enabled (recommended) or disable it if you want files to be publicly readable without presigned URLs.
6.  Click **Create bucket**.

## 2. Configure CORS

To allow your frontend to upload directly to S3, you must configure CORS:

1.  Open your bucket.
2.  Go to the **Permissions** tab.
3.  Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
4.  Paste the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5.  Click **Save changes**.

## 3. Create IAM User

1.  Go to the [IAM Console](https://console.aws.amazon.com/iam/).
2.  Click **Users** > **Create user**.
3.  Enter a username (e.g., `s3-uploader`).
4.  Select **Attach policies directly**.
5.  Click **Create policy**.
6.  Select the **JSON** tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject",
                "s3:AbortMultipartUpload"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

7.  Replace `your-bucket-name` with your actual bucket name.
8.  Complete the user creation.
9.  Go to the user's **Security credentials** tab and create an **Access key**.
10. Copy the **Access Key ID** and **Secret Access Key** to your `.env.local` file.
