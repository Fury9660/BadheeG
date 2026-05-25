-- 1. Create the 'product-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Access (Anyone can view images)
create policy "Public Access Product Images"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- 3. Allow Authenticated Uploads (Partners can upload)
create policy "Authenticated Upload Product Images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' and auth.role() = 'authenticated' );

-- 4. Allow Owners to Delete/Update their own images (Optional but good)
create policy "Owner Delete Product Images"
  on storage.objects for delete
  using ( bucket_id = 'product-images' and auth.uid() = owner );
