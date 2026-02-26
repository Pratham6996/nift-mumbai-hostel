# Supabase Storage Setup

## Create the `feedback-images` bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**
3. Set:
   - **Name**: `feedback-images`
   - **Public**: `OFF` (private bucket)
   - **File size limit**: `1MB` (1048576 bytes)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
4. Click **Create Bucket**

## Storage Policies

After creating the bucket, add these policies:

### Allow authenticated uploads
- **Policy name**: `Allow authenticated uploads`
- **Allowed operations**: `INSERT`
- **Target roles**: `authenticated`
- **Policy Definition**: `(bucket_id = 'feedback-images')`

### Allow service role full access
- **Policy name**: `Service role access`
- **Allowed operations**: `SELECT, INSERT, UPDATE, DELETE`
- **Target roles**: `service_role`
- **Policy Definition**: `(bucket_id = 'feedback-images')`

### Allow public read for signed URLs
- **Policy name**: `Public read`
- **Allowed operations**: `SELECT`
- **Target roles**: `public`
- **Policy Definition**: `(bucket_id = 'feedback-images')`
